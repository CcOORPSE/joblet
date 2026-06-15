import { logger } from "@/lib/logger";
import {
  SYSTEM_PROMPT,
  getCommunicationAnalysisPrompt,
} from "@/lib/prompts/communication-analysis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("analyze-communication request received");

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT + "\n\n" + getCommunicationAnalysisPrompt(transcript) },
    ]);

    const analysis = result.response.text();

    logger.info("Communication analysis completed successfully");

    return NextResponse.json({ analysis: JSON.parse(analysis || "{}") }, { status: 200 });
  } catch (error) {
    logger.error("Error analyzing communication skills");

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
