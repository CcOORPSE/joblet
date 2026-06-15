import { db, firebaseInitError } from "../config/firebaseAdmin.js";
import admin from "../config/firebaseAdmin.js";
import { parsePdfBuffer } from "../utils/parsePdf.js";
import { logActivity } from "../services/chat/activityLogger.js";
import { runJobScraper } from "../services/jobScraperService.js";
import { fetchWebSearchResults } from "../services/chat/webSearchService.js";
import { detectChatMode, stripModePrefix } from "../services/chat/chatModeDetector.js";
import { getGeminiModel, resolveWorkingGeminiModel, getGenAI } from "../services/chat/geminiClient.js";
import {
  matchResumeToJobs,
  formatResumeMatchResponse,
  extractTextFromFeedback,
} from "../services/chat/resumeJobMatcher.js";
import { detectApplicantIntent } from "../services/chat/intentDetector.js";
import { formatWebSearchResponse } from "../services/chat/webSearchFormatter.js";
const MAX_SESSION_MESSAGES = 100;

const toIso = (val) => {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  if (typeof val === "number") return new Date(val).toISOString();
  return String(val);
};

const sessionTitleFromMessage = (message) => {
  const trimmed = (message || "").trim();
  if (!trimmed) return "New conversation";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
};

const fetchActiveJobs = async () => {
  try {
    const snapshot = await db.collection("jobs").where("visible", "==", true).get();
    const jobs = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      jobs.push({
        _id: doc.id,
        title: d.title || "",
        location: d.location || "Remote",
        level: d.level || "",
        category: d.category || "",
        salary: d.salary || 0,
        description:
          typeof d.description === "string"
            ? d.description.replace(/<[^>]*>/g, "").slice(0, 400)
            : "",
        companyName: d.companyIdDetails?.name || d.companyId?.name || "Company",
      });
    });
    return jobs;
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    return [];
  }
};

const buildSystemPrompt = (intent, jobs = [], resumeText = "") => {
  const jobSummary = jobs
    .slice(0, 20)
    .map(
      (j) =>
        `[ID: ${j._id}] ${j.title} @ ${j.companyName} — ${j.location} | ${j.level} | Salary: ${j.salary || "Negotiable"}\nDescription snippet: ${j.description}`
    )
    .join("\n\n");

  const basePrompt = `You are "CareerBot", an expert AI career assistant embedded inside a job portal called Joblet.AI.
You are warm, insightful, precise, and highly knowledgeable about resumes, ATS systems, and job markets.
You help users: analyze their resumes for ATS compatibility, find matching jobs, and improve their career documents.

Important formatting rules:
- Use clean markdown (bold, lists, headers) in your responses.
- When you want to display an ATS score inline, output a special token exactly like: [SCORE_BADGE:85] (replace 85 with the score).
- When you want to display a job card inline, output a special token exactly like: [JOB_CARD:jobId] (replace jobId with the actual job ID).
- You can render multiple job cards in one response.
- Never invent job IDs — only use the exact IDs from the provided job list.
- Be concise but thorough. Format feedback in clear sections.
${resumeText ? `\nUser's Resume Content:\n"""\n${resumeText.slice(0, 4000)}\n"""` : ""}`;

  if (intent === "ATS_SCAN") {
    return `${basePrompt}

The user wants an ATS resume analysis. Perform a thorough analysis and:
1. Give an overall ATS score using the [SCORE_BADGE:XX] token.
2. List what's strong about the resume.
3. List specific improvements (keyword gaps, formatting, structure).
4. Give a short summary with actionable next steps.`;
  }

  if (intent === "JOB_MATCH") {
    return `${basePrompt}

The user wants job recommendations based on their resume. Here are the active portal jobs:
${jobSummary || "No active jobs available currently."}

Analyze the user's resume skills/experience and:
1. Identify the top 3-5 best matching jobs from the list.
2. For each match, explain WHY it's a good fit.
3. Render each matched job with [JOB_CARD:jobId].
4. Give a brief match score explanation for each.
Only recommend jobs from the list above.`;
  }

  if (intent === "CAREER_ADVICE") {
    return `${basePrompt}

The user is asking for career advice or resume improvement tips. Provide:
1. Specific, actionable improvements based on their question.
2. Examples of stronger language or formatting where applicable.
3. Industry best practices relevant to their field.`;
  }

  return `${basePrompt}

Answer the user's question helpfully. If they haven't uploaded a resume yet, kindly encourage them to do so for personalized advice.
Keep responses friendly, motivating, and professional.
Available active jobs count: ${jobs.length}.`;
};

const persistChatTurn = async (userId, sessionId, userMessage, assistantReply) => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const newEntries = [
    { role: "user", content: userMessage, createdAt: Date.now() },
    { role: "assistant", content: assistantReply, createdAt: Date.now() },
  ];

  if (sessionId) {
    const ref = db.collection("chat_sessions").doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== userId || doc.data().role !== "user") {
      sessionId = null;
    } else {
      const existing = doc.data().messages || [];
      const messages = [...existing, ...newEntries].slice(-MAX_SESSION_MESSAGES);
      await ref.update({ messages, updatedAt: now });
      return sessionId;
    }
  }

  const ref = await db.collection("chat_sessions").add({
    userId,
    role: "user",
    title: sessionTitleFromMessage(userMessage),
    messages: newEntries,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const handleChatSession = async (req, res) => {
  try {
    if (!db) {
      console.error("[ChatBot] Firebase Firestore not initialized", { firebaseInitError });
      return res.status(503).json({
        success: false,
        message: "Database not initialized. Please check your Firebase configuration.",
        debug: {
          firebaseError: firebaseInitError,
          hasDb: !!db
        }
      });
    }

    const { message, history = [], resumeText = "", sessionId: incomingSessionId, chatMode = "default" } = req.body;
    const userId = req.user.uid;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const effectiveMode = detectChatMode(message, { resumeText, currentMode: chatMode });
    const cleanedMessage = stripModePrefix(message, effectiveMode);

    let responseText = "";
    let intent = "GENERAL";
    let activeJobsCount = 0;

    if (effectiveMode === "job-scraper") {
      // 1. "@server/job-scraper/" mode — no Gemini
      intent = "JOB_MATCH";
      let query = cleanedMessage;
      let location = "Singapore";
      if (query.toLowerCase().includes(" in ")) {
        const parts = query.split(/ in /i);
        query = parts[0].trim();
        location = parts[1].trim();
      }

      if (!query) {
        responseText = "Please specify a job role to scrape, e.g. `@server/job-scraper/ Node.js developer in Singapore`";
      } else {
        responseText = `🔍 **Running Live Job Scraper for "${query}" in "${location}"...**\n\n`;
        try {
          const result = await runJobScraper(query, location, 3);
          let savedCount = 0;
          const jobCards = [];

          if (result.success && result.jobs && result.jobs.length > 0) {
            const existingSnap = await db.collection("jobs").where("isScraped", "==", true).get();
            const existingJobIds = new Set();
            existingSnap.forEach(doc => {
              const d = doc.data();
              if (d.job_id) existingJobIds.add(String(d.job_id));
            });

            for (const scrapedJob of result.jobs) {
              const jobIdStr = String(scrapedJob.job_id);
              if (existingJobIds.has(jobIdStr)) {
                const matchDoc = existingSnap.docs.find(doc => doc.data().job_id === jobIdStr);
                if (matchDoc) {
                  jobCards.push(`[JOB_CARD:${matchDoc.id}]`);
                }
                continue;
              }

              const externalLink = scrapedJob.provider === "linkedin"
                ? `https://www.linkedin.com/jobs/view/${scrapedJob.job_id}`
                : `https://www.mycareersfuture.gov.sg/job/${scrapedJob.job_id}`;

              const newJob = {
                title: scrapedJob.job_title || "Job Listing",
                description: scrapedJob.description || "No description available.",
                location: (scrapedJob.location || location || "Singapore").trim(),
                salary: 0,
                level: scrapedJob.level || "Intermediate",
                category: query,
                date: Date.now(),
                visible: true,
                isScraped: true,
                job_id: jobIdStr,
                externalLink: externalLink,
                companyIdDetails: {
                  name: scrapedJob.company || "Premium Recruiter",
                  image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200"
                }
              };

              const docRef = await db.collection("jobs").add(newJob);
              jobCards.push(`[JOB_CARD:${docRef.id}]`);
              savedCount++;
            }

            responseText += `✅ **Scrape complete!** Discovered and saved **${savedCount}** new jobs matching your request. Here are the top results:\n\n${jobCards.join("\n")}`;
          } else {
            responseText += "No new jobs were found or scrape sources timed out. Please try a different title or search criteria.";
          }
        } catch (scraperErr) {
          responseText += `❌ Failed to execute job scraper: ${scraperErr.message || scraperErr}`;
        }
      }
    } else if (effectiveMode === "resume_job") {
      // 2. "@server/resume_job/" mode — keyword matching, no Gemini
      intent = "JOB_MATCH";
      let textToMatch = resumeText;

      if (!textToMatch) {
        try {
          const resumeSnap = await db.collection("resume_analyses")
            .where("userId", "==", userId)
            .get();
          if (!resumeSnap.empty) {
            const docs = [];
            resumeSnap.forEach(d => docs.push(d.data()));
            docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            const latestDoc = docs[0];
            textToMatch =
              latestDoc.resumeText ||
              extractTextFromFeedback(latestDoc.feedback) ||
              "";
          }
        } catch (dbErr) {
          console.warn("Resume analysis lookup skipped:", dbErr.message);
        }
      }

      const activeJobs = await fetchActiveJobs();
      activeJobsCount = activeJobs.length;

      if (!textToMatch) {
        responseText = "⚠️ **Resume Required:** Please attach your PDF resume first using the **Attach** clip icon so I can run matching logic against active job postings.";
      } else if (activeJobs.length === 0) {
        responseText = "No active jobs are currently listed on the portal. Try **@server/job-scraper/** mode to fetch live listings first.";
      } else {
        const matches = matchResumeToJobs(textToMatch, activeJobs, 3);
        responseText = formatResumeMatchResponse(matches);
      }
    } else if (effectiveMode === "websearch") {
      // 3. Web search mode — DuckDuckGo/Google only, no Gemini
      intent = "GENERAL";
      const cleanedQuery = cleanedMessage;

      if (!cleanedQuery) {
        responseText = "Please type a topic or query to search the web, e.g. `Latest features in Node.js 22`";
      } else {
        const searchResults = await fetchWebSearchResults(cleanedQuery);
        responseText = formatWebSearchResponse(cleanedQuery, searchResults);
      }
    } else {
      // 4. Default Mode (CareerBot) — requires Gemini
      try {
        // Validate Gemini API Key before proceeding
        if (!process.env.GEMINI_API_KEY) {
          console.error("[Gemini] API Key not configured in environment");
          return res.status(503).json({
            success: false,
            message: "AI assistant is temporarily unavailable. Please check Gemini API configuration.",
            debug: {
              error: "GEMINI_API_KEY not set in environment variables",
              suggestion: "Set GEMINI_API_KEY in Vercel project settings"
            }
          });
        }

        intent = detectApplicantIntent(message);
        let activeJobs = [];

        if (intent === "JOB_MATCH") {
          activeJobs = await fetchActiveJobs();
          activeJobsCount = activeJobs.length;
        }

        const systemPrompt = buildSystemPrompt(intent, activeJobs, resumeText);
        
        let modelName;
        try {
          modelName = await resolveWorkingGeminiModel();
        } catch (modelError) {
          console.error("[Gemini] Failed to resolve working model", {
            error: modelError.message,
            suggestion: "Check GEMINI_API_KEY is valid and has API access"
          });
          return res.status(503).json({
            success: false,
            message: "AI service failed to initialize. Please try again in a moment.",
            debug: {
              error: modelError.message,
              type: "model_resolution_failed"
            }
          });
        }

        const model = getGenAI().getGenerativeModel({ model: modelName });

        const geminiHistory = history.map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            {
              role: "model",
              parts: [
                {
                  text: "Understood! I'm CareerBot, your AI career assistant. I'll help you analyze resumes, match jobs, and provide career guidance. How can I help you today?",
                },
              ],
            },
            ...geminiHistory,
          ],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
          },
        });

        const result = await chat.sendMessage(message);
        responseText = result.response.text();
      } catch (geminiError) {
        console.error("[Gemini] Chat generation failed", {
          error: geminiError.message,
          code: geminiError.code,
          userId: req.user?.uid
        });

        // Provide helpful error messages based on error type
        let errorMessage = "AI assistant encountered an error";
        if (geminiError.message?.includes("API_KEY")) {
          errorMessage = "Gemini API key is invalid or not set";
        } else if (geminiError.message?.includes("quota")) {
          errorMessage = "API quota exceeded. Please try again later.";
        } else if (geminiError.message?.includes("permission")) {
          errorMessage = "API authentication failed. Check credentials.";
        }

        return res.status(503).json({
          success: false,
          message: `${errorMessage}. This is a temporary issue.`,
          debug: {
            geminiError: geminiError.message,
            errorCode: geminiError.code
          }
        });
      }
    }

    const sessionId = await persistChatTurn(userId, incomingSessionId, message.trim(), responseText);

    console.log("[ChatBot] Message processed successfully", {
      userId,
      intent,
      chatMode: effectiveMode,
      messageLength: message.length,
      sessionId
    });

    await logActivity(userId, "chat_message", {
      metadata: {
        intent,
        chatMode: effectiveMode,
        requestedMode: chatMode,
        sessionId,
        preview: message.trim().slice(0, 60),
      },
    });

    return res.json({
      success: true,
      reply: responseText,
      intent,
      chatMode: effectiveMode,
      jobsAvailable: activeJobsCount,
      sessionId,
    });
  } catch (error) {
    console.error("[ChatBot] Unhandled error in handleChatSession", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      messagePreview: req.body.message?.substring(0, 50)
    });

    // Determine error type and appropriate response
    const isGeminiQuota =
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("Too Many Requests");

    const isGeminiAuth =
      error.message?.includes("GEMINI_API_KEY") ||
      error.message?.includes("API key") ||
      error.message?.includes("authentication failed");

    const isFirebaseError =
      error.message?.includes("Firebase") ||
      error.message?.includes("Firestore") ||
      !db;

    let status = 500;
    let message = "An unexpected error occurred. Please try again.";
    let errorType = "unknown";

    if (isGeminiQuota) {
      status = 503;
      message = "CareerBot is temporarily unavailable due to API quota limits. Try @server/job-scraper/, @server/resume_job/, or Web Search modes instead.";
      errorType = "gemini_quota";
    } else if (isGeminiAuth) {
      status = 503;
      message = "AI service authentication failed. Please check Gemini API configuration.";
      errorType = "gemini_auth";
    } else if (isFirebaseError) {
      status = 503;
      message = "Database service unavailable. Please try again shortly.";
      errorType = "firebase_error";
    }

    res.status(status).json({
      success: false,
      message,
      debug: {
        errorType,
        originalError: process.env.NODE_ENV === "development" ? error.message : undefined
      }
    });
  }
};

export const parseResumePdf = async (req, res) => {
  try {
    if (!db) {
      console.error("[ChatBot] Firebase Firestore not initialized in parseResumePdf", { firebaseInitError });
      return res.status(503).json({
        success: false,
        message: "Database not initialized. Please check your Firebase configuration.",
        debug: { firebaseError: firebaseInitError }
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    let parsedPdf;
    try {
      parsedPdf = await parsePdfBuffer(fileBuffer);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Could not parse this PDF. Please ensure it's a readable PDF file.",
      });
    }

    return res.json({
      success: true,
      resumeText: parsedPdf.text || "",
      pageCount: parsedPdf.numpages || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listSessions = async (req, res) => {
  try {
    if (!db) {
      console.error("[ChatBot] Firebase Firestore not initialized in listSessions", { firebaseInitError });
      return res.status(503).json({
        success: false,
        message: "Database not initialized. Please check your Firebase configuration.",
        debug: { firebaseError: firebaseInitError }
      });
    }

    const userId = req.user.uid;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const snapshot = await db
      .collection("chat_sessions")
      .where("userId", "==", userId)
      .where("role", "==", "user")
      .get();

    const sessions = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "Conversation",
          messageCount: (data.messages || []).length,
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
          _sort: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
        };
      })
      .sort((a, b) => b._sort - a._sort)
      .slice(0, limit)
      .map(({ _sort, ...rest }) => rest);

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    if (!db) {
      console.error("[ChatBot] Firebase Firestore not initialized in getSession", { firebaseInitError });
      return res.status(503).json({
        success: false,
        message: "Database not initialized. Please check your Firebase configuration.",
        debug: { firebaseError: firebaseInitError }
      });
    }

    const userId = req.user.uid;
    const { sessionId } = req.params;

    const doc = await db.collection("chat_sessions").doc(sessionId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const data = doc.data();
    if (data.userId !== userId || data.role !== "user") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({
      success: true,
      session: {
        id: doc.id,
        title: data.title,
        messages: (data.messages || []).map(({ role, content }) => ({ role, content })),
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertSession = async (req, res) => {
  try {
    if (!db) {
      console.error("[ChatBot] Firebase Firestore not initialized in upsertSession", { firebaseInitError });
      return res.status(503).json({
        success: false,
        message: "Database not initialized. Please check your Firebase configuration.",
        debug: { firebaseError: firebaseInitError }
      });
    }

    const userId = req.user.uid;
    const { sessionId, title, messages = [] } = req.body;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const capped = messages.slice(-MAX_SESSION_MESSAGES);

    if (sessionId) {
      const ref = db.collection("chat_sessions").doc(sessionId);
      const doc = await ref.get();
      if (!doc.exists || doc.data().userId !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      await ref.update({
        title: title || doc.data().title,
        messages: capped,
        updatedAt: now,
      });
      return res.json({ success: true, sessionId });
    }

    const ref = await db.collection("chat_sessions").add({
      userId,
      role: "user",
      title: title || "New conversation",
      messages: capped,
      createdAt: now,
      updatedAt: now,
    });

    res.json({ success: true, sessionId: ref.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
