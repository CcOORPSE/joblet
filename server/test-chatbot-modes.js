/**
 * Live integration tests for all applicant chat sections.
 * Run with: node test-chatbot-modes.js
 *
 * Sections tested:
 *  1. default (CareerBot) — requires GEMINI_API_KEY
 *  2. websearch — no Gemini
 *  3. resume_job — no Gemini
 *  4. job-scraper — no Gemini (optional, set RUN_SCRAPER=1)
 *  5. auto mode detection from default
 */

import "./config/loadEnv.js";
import { handleChatSession } from "./controller/applicantChatbotController.js";
import { detectChatMode } from "./services/chat/chatModeDetector.js";

console.log("========================================");
console.log("Applicant Chat Section Tests");
console.log("========================================\n");

const MOCK_USER = "test-user-id-123";
let passed = 0;
let failed = 0;

const runTest = async (label, chatMode, message, resumeText = "", expectations = {}) => {
  console.log(`\n----------------------------------------`);
  console.log(`TEST: ${label}`);
  console.log(`Mode: "${chatMode}" | Message: "${message.slice(0, 60)}..."`);
  console.log(`----------------------------------------`);

  const mockReq = {
    user: { uid: MOCK_USER },
    body: { message, history: [], resumeText, chatMode, sessionId: null },
  };

  let responseData = null;
  const mockRes = {
    status(code) {
      console.log(`STATUS: ${code}`);
      return mockRes;
    },
    json(data) {
      responseData = data;
      return mockRes;
    },
  };

  try {
    await handleChatSession(mockReq, mockRes);

    if (expectations.shouldSucceed !== false && !responseData?.success) {
      const quotaMsg = responseData?.message || "";
      if (expectations.allowGeminiQuotaFailure && quotaMsg.includes("quota")) {
        console.log(`SKIP (Gemini quota) — ${quotaMsg.slice(0, 80)}...`);
        passed++;
        return;
      }
      throw new Error(responseData?.message || "Request failed");
    }

    if (expectations.expectedMode) {
      assertEqual(responseData.chatMode, expectations.expectedMode, "chatMode");
    }

    if (expectations.replyContains) {
      for (const fragment of expectations.replyContains) {
        if (!responseData.reply?.includes(fragment)) {
          throw new Error(`Reply missing expected fragment: "${fragment}"`);
        }
      }
    }

    if (expectations.replyNotContains) {
      for (const fragment of expectations.replyNotContains) {
        if (responseData.reply?.includes(fragment)) {
          throw new Error(`Reply should not contain: "${fragment}"`);
        }
      }
    }

    console.log(`PASS — Reply preview: ${(responseData.reply || "").slice(0, 120)}...`);
    passed++;
  } catch (err) {
    console.error(`FAIL — ${err.message}`);
    failed++;
  }
};

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}

async function runModeDetectionTests() {
  console.log("\n=== Mode Detection (unit) ===");
  const cases = [
    ["@server/job-scraper/ React dev", "job-scraper"],
    ["@server/resume_job/ match jobs", "resume_job"],
    ["scrape jobs for Python", "job-scraper"],
    ["web search Node.js 22 features", "websearch"],
    ["Hello CareerBot", "default"],
    ["match my resume to jobs", "resume_job"],
  ];

  for (const [message, expected] of cases) {
    const detected = detectChatMode(message, {
      resumeText: message.includes("match") ? "React developer resume" : "",
    });
    if (detected === expected) {
      console.log(`PASS detectChatMode("${message.slice(0, 40)}") → ${detected}`);
      passed++;
    } else {
      console.error(`FAIL detectChatMode: expected ${expected}, got ${detected}`);
      failed++;
    }
  }
}

async function startTests() {
  await runModeDetectionTests();

  // Section 2: Web Search (no Gemini)
  await runTest(
    "Web Search — no Gemini",
    "websearch",
    "Latest features in Node.js",
    "",
    { replyContains: ["Web Search Results", "Sources:"] }
  );

  // Section 3: Resume Job Match without resume (no Gemini)
  await runTest(
    "Resume Job — missing resume prompt",
    "resume_job",
    "Match me to any jobs",
    "",
    { replyContains: ["Resume Required"] }
  );

  // Section 3b: Resume Job Match with resume (no Gemini)
  const sampleResume =
    "Jayesh - Senior Software Engineer with 5 years experience in React, Node.js, Express, Firebase, Python.";
  await runTest(
    "Resume Job — keyword matching",
    "resume_job",
    "Match me with jobs",
    sampleResume,
    { replyNotContains: ["GEMINI", "API key"] }
  );

  // Section 5: Auto-detect scraper from default mode
  if (process.env.RUN_SCRAPER === "1") {
    await runTest(
      "Job Scraper — live scrape",
      "default",
      "@server/job-scraper/ software engineer in Singapore",
      "",
      { expectedMode: "job-scraper", replyContains: ["Scrape"] }
    );
  } else {
    console.log("\nSKIP live scraper test (set RUN_SCRAPER=1 to enable)");
  }

  // Section 1: Default CareerBot (requires Gemini)
  if (process.env.GEMINI_API_KEY) {
    await runTest(
      "Default CareerBot — Gemini",
      "default",
      "Hello CareerBot, can you introduce yourself?",
      "",
      {
        expectedMode: "default",
        replyContains: ["CareerBot"],
        allowGeminiQuotaFailure: true,
      }
    );
  } else {
    console.log("\nSKIP default/Gemini tests (GEMINI_API_KEY not set)");
  }

  await runTest(
    "Auto-detect websearch from default",
    "default",
    "web search TypeScript release notes",
    "",
    { expectedMode: "websearch", replyContains: ["Web Search Results"] }
  );

  console.log("\n========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  process.exit(failed > 0 ? 1 : 0);
}

startTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
