import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectChatMode, stripModePrefix } from "../services/chat/chatModeDetector.js";
import {
  extractKeywords,
  matchResumeToJobs,
  formatResumeMatchResponse,
  extractTextFromFeedback,
} from "../services/chat/resumeJobMatcher.js";
import { formatWebSearchResponse } from "../services/chat/webSearchFormatter.js";
import { detectApplicantIntent } from "../services/chat/intentDetector.js";

describe("chatModeDetector", () => {
  it("detects job-scraper from @server prefix", () => {
    assert.equal(
      detectChatMode("@server/job-scraper/ Node.js developer in Singapore"),
      "job-scraper"
    );
  });

  it("detects resume_job from @server prefix", () => {
    assert.equal(detectChatMode("@server/resume_job/ match my jobs"), "resume_job");
  });

  it("auto-detects scraper from natural language", () => {
    assert.equal(detectChatMode("scrape jobs for Python developer"), "job-scraper");
  });

  it("auto-detects websearch without job context", () => {
    assert.equal(detectChatMode("web search latest Node.js features"), "websearch");
  });

  it("does not route job queries to websearch", () => {
    assert.equal(detectChatMode("search for jobs in Singapore"), "default");
  });

  it("auto-detects resume match when resume is attached", () => {
    assert.equal(
      detectChatMode("match my resume to jobs", { resumeText: "React developer" }),
      "resume_job"
    );
  });

  it("respects manually selected non-default mode", () => {
    assert.equal(
      detectChatMode("hello there", { currentMode: "websearch" }),
      "websearch"
    );
  });

  it("falls back to default for general questions", () => {
    assert.equal(detectChatMode("Give me career tips"), "default");
  });

  it("strips mode prefixes", () => {
    assert.equal(
      stripModePrefix("@server/job-scraper/ React dev", "job-scraper"),
      "React dev"
    );
  });
});

describe("resumeJobMatcher", () => {
  const sampleJobs = [
    {
      _id: "job1",
      title: "Senior React Developer",
      description: "Build React applications with Node.js and TypeScript",
      location: "Remote",
      level: "Senior",
      category: "Engineering",
      companyName: "Acme",
    },
    {
      _id: "job2",
      title: "Data Analyst",
      description: "SQL and Python analytics",
      location: "Singapore",
      level: "Junior",
      category: "Data",
      companyName: "DataCo",
    },
  ];

  it("extracts keywords from resume text", () => {
    const keywords = extractKeywords("Senior React developer with Node.js experience");
    assert.ok(keywords.includes("react"));
    assert.ok(keywords.includes("node.js"));
  });

  it("matches React resume to React job", () => {
    const resume = "Senior Software Engineer with React, Node.js, TypeScript, Firebase";
    const matches = matchResumeToJobs(resume, sampleJobs, 3);
    assert.ok(matches.length > 0);
    assert.equal(matches[0].job._id, "job1");
  });

  it("formats match response with JOB_CARD tokens", () => {
    const resume = "React Node.js developer";
    const matches = matchResumeToJobs(resume, sampleJobs, 3);
    const response = formatResumeMatchResponse(matches);
    assert.match(response, /\[JOB_CARD:job1\]/);
    assert.match(response, /\[SCORE_BADGE:\d+\]/);
  });

  it("returns helpful message when no matches", () => {
    const response = formatResumeMatchResponse([]);
    assert.match(response, /No strong job matches/i);
  });

  it("extracts text from feedback object", () => {
    const text = extractTextFromFeedback({
      ATS: { tips: [{ tip: "Good use of React" }] },
      skills: { score: 80 },
    });
    assert.match(text, /React/);
  });
});

describe("webSearchFormatter", () => {
  it("formats search results without Gemini", () => {
    const results = [
      { title: "Node.js 22 Release", link: "https://nodejs.org", snippet: "New features", source: "DuckDuckGo" },
    ];
    const response = formatWebSearchResponse("Node.js 22", results);
    assert.match(response, /Node\.js 22 Release/);
    assert.match(response, /Sources:/);
    assert.match(response, /https:\/\/nodejs\.org/);
  });

  it("handles empty results", () => {
    const response = formatWebSearchResponse("test query", []);
    assert.match(response, /couldn't fetch/i);
  });
});

describe("intentDetector", () => {
  it("detects ATS intent", () => {
    assert.equal(detectApplicantIntent("What's my ATS score?"), "ATS_SCAN");
  });

  it("detects job match with remote jobs phrase", () => {
    assert.equal(detectApplicantIntent("Find remote developer jobs"), "JOB_MATCH");
  });

  it("does not misclassify remote work tips as job match", () => {
    assert.equal(detectApplicantIntent("Tips for remote work productivity"), "CAREER_ADVICE");
  });
});
