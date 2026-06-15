"use server";

import { SYSTEM_PROMPT, getInterviewAnalyticsPrompt } from "@/lib/prompts/analytics";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import type { Question } from "@/types/interview";
import type { Analytics } from "@/types/response";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateInterviewAnalytics = async (payload: {
  callId: string;
  interviewId: string;
  transcript: string;
}) => {
  const { callId, interviewId, transcript } = payload;

  try {
    const response = await ResponseService.getResponseByCallId(callId);
    const interview = await InterviewService.getInterviewById(interviewId);

    if (response.analytics) {
      return { analytics: response.analytics as Analytics, status: 200 };
    }

    const interviewTranscript = transcript || response.details?.transcript;
    const questions = interview?.questions || [];
    const mainInterviewQuestions = questions
      .map((q: Question, index: number) => `${index + 1}. ${q.question}`)
      .join("\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = getInterviewAnalyticsPrompt(interviewTranscript, mainInterviewQuestions);

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT + "\n\n" + prompt },
    ]);

    const content = result.response.text();
    const analyticsResponse = JSON.parse(content);

    analyticsResponse.mainInterviewQuestions = questions.map((q: Question) => q.question);

    return { analytics: analyticsResponse, status: 200 };
  } catch (error) {
    console.error("Error in Gemini request:", error);

    return { error: "internal server error", status: 500 };
  }
};
