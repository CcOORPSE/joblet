import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, createUserPrompt } from "@/lib/prompts/generate-insights";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("generate-insights request received");
  const body = await req.json();

  const responses = await ResponseService.getAllResponses(body.interviewId);
  const interview = await InterviewService.getInterviewById(body.interviewId);

  let callSummaries = "";
  if (responses) {
    for (const response of responses) {
      callSummaries += response.details?.call_analysis?.call_summary;
    }
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  try {
    const prompt = createUserPrompt(
      callSummaries,
      interview.name,
      interview.objective,
      interview.description,
    );

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT + "\n\n" + prompt },
    ]);

    const content = result.response.text();
    const insightsResponse = JSON.parse(content);

    await InterviewService.updateInterview(
      { insights: insightsResponse.insights },
      body.interviewId,
    );

    logger.info("Insights generated successfully");

    return NextResponse.json(
      { response: content },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating insights");

    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
