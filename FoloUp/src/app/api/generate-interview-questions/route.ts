import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, generateQuestionsPrompt } from "@/lib/prompts/generate-questions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("generate-interview-questions request received");
  const body = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT + "\n\n" + generateQuestionsPrompt(body) },
    ]);

    const content = result.response.text();

    logger.info("Interview questions generated successfully");

    return NextResponse.json(
      { response: content },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating interview questions");

    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
