import { db } from "../config/firebaseAdmin.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parsePdfBuffer } from "../utils/parsePdf.js";
import { uploadResumeFile, getSignedResumeUrl } from "../utils/uploadResumeFile.js";
import { logActivity } from "../services/chat/activityLogger.js";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeResume = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { companyName = "", jobTitle = "", jobDescription = "" } = req.body;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ success: false, message: "No resume file uploaded" });
    }

    // 1. Read and parse PDF
    const fileBuffer = resumeFile.buffer;
    let parsedPdf;
    try {
      parsedPdf = await parsePdfBuffer(fileBuffer);
    } catch (pdfError) {
      return res.status(400).json({ success: false, message: "Failed to parse PDF file. Please ensure it is a valid PDF." });
    }

    const resumeText = parsedPdf.text || "";

    // 2. Prepare Gemini prompt
    const prompt = `
You are an expert in ATS (Applicant Tracking System) and resume analysis.
Please analyze and rate this resume and suggest how to improve it.
The rating can be low if the resume is bad.
Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.

The resume text extracted is:
"""
${resumeText}
"""

The job target is:
Company Name: ${companyName}
Job Title: ${jobTitle}
Job Description: ${jobDescription}

Provide the feedback using the following JSON format:
{
  "overallScore": number, // max 100
  "ATS": {
    "score": number, // rate based on ATS suitability
    "tips": [
      {
        "type": "good",
        "tip": "short tip explanation"
      },
      {
        "type": "improve",
        "tip": "short tip explanation for improvement"
      }
    ]
  },
  "toneAndStyle": {
    "score": number, // max 100
    "tips": [
      {
        "type": "good",
        "tip": "short feedback title",
        "explanation": "detailed description"
      }
    ]
  },
  "content": {
    "score": number, // max 100
    "tips": [
      {
        "type": "good",
        "tip": "short feedback title",
        "explanation": "detailed description"
      }
    ]
  },
  "structure": {
    "score": number, // max 100
    "tips": [
      {
        "type": "good",
        "tip": "short feedback title",
        "explanation": "detailed description"
      }
    ]
  },
  "skills": {
    "score": number, // max 100
    "tips": [
      {
        "type": "good",
        "tip": "short feedback title",
        "explanation": "detailed description"
      }
    ]
  }
}

Return ONLY valid JSON complying with this structure. Do not include markdown code block syntax (like \`\`\`json) or comments.
`;

    // 3. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const aiResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = aiResult.response.text();
    let feedback;
    try {
      feedback = JSON.parse(responseText);
    } catch (parseError) {
      console.error("AI response parse error:", responseText);
      return res.status(500).json({ success: false, message: "AI generated invalid JSON structure. Please try again." });
    }

    let resumeUpload;
    try {
      resumeUpload = await uploadResumeFile(resumeFile);
    } catch (cloudError) {
      return res.status(500).json({ success: false, message: cloudError.message || "Failed to upload resume to storage" });
    }

    // 5. Save to Firestore
    const analysisData = {
      userId,
      companyName,
      jobTitle,
      jobDescription,
      resumeUrl: resumeUpload.url,
      resumeStoragePath: resumeUpload.storagePath,
      resumeText: resumeText.slice(0, 4000),
      feedback,
      createdAt: Date.now()
    };

    const docRef = await db.collection("resume_analyses").add(analysisData);

    const overallScore = feedback?.overallScore ?? feedback?.ATS?.score;
    await logActivity(userId, "resume_analyzed", {
      metadata: {
        analysisId: docRef.id,
        score: overallScore,
        jobTitle,
      },
    });

    return res.json({
      success: true,
      message: "Resume analyzed successfully",
      id: docRef.id,
      analysis: { id: docRef.id, ...analysisData }
    });

  } catch (error) {
    console.error("Error in analyzeResume:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserResumes = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection("resume_analyses")
      .where("userId", "==", userId)
      .get();

    const analyses = [];
    snapshot.forEach((doc) => {
      analyses.push({ id: doc.id, ...doc.data() });
    });
    analyses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.json({ success: true, analyses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumeDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection("resume_analyses").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Resume analysis not found" });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access to report" });
    }

    const analysis = { id: doc.id, ...data };
    if (analysis.resumeStoragePath) {
      const freshUrl = await getSignedResumeUrl(analysis.resumeStoragePath);
      if (freshUrl) analysis.resumeUrl = freshUrl;
    }

    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
