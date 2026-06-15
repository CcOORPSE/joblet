import './config/loadEnv.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Hi");
      console.log(`✓ Model ${m} works! Response: ${res.response.text().trim()}`);
      return;
    } catch (err) {
      console.log(`✗ Model ${m} failed: ${err.message}`);
    }
  }
}

testModels().catch(console.error);
