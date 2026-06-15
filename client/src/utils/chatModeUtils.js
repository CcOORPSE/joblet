/**
 * Client-side chat mode detection — mirrors server/services/chat/chatModeDetector.js
 */

const SCRAPER_PREFIX = /@server\/job-scraper\//i;
const RESUME_PREFIX = /@server\/resume_job\//i;

const SCRAPER_KEYWORDS = [
  "scrape job", "scrape jobs", "live scrape", "job scraper", "run scraper",
  "run job scraper", "search linkedin", "search mycareersfuture", "scrape linkedin",
  "fetch live jobs", "scrape for jobs",
];

const WEBSEARCH_KEYWORDS = [
  "web search", "search the web", "look up online", "search online",
  "latest news about", "what's trending", "look up ", "google search", "bing search",
];

const RESUME_MATCH_KEYWORDS = [
  "match my resume", "match resume", "resume match", "match me to", "match me with",
  "jobs for my resume", "match jobs against", "which jobs fit", "best jobs for me",
  "compare my resume", "match my profile",
];

export const detectChatMode = (message, { resumeText = "", currentMode = "default" } = {}) => {
  const original = (message || "").trim();
  const msg = original.toLowerCase();

  if (!msg) return currentMode !== "default" ? currentMode : "default";

  if (SCRAPER_PREFIX.test(original)) return "job-scraper";
  if (RESUME_PREFIX.test(original)) return "resume_job";

  if (currentMode !== "default") return currentMode;

  if (SCRAPER_KEYWORDS.some((k) => msg.includes(k)) || /\bscrape\b/.test(msg)) {
    return "job-scraper";
  }

  if (WEBSEARCH_KEYWORDS.some((k) => msg.includes(k))) {
    const isJobQuery =
      msg.includes("job") || msg.includes("career") || msg.includes("hiring");
    if (!isJobQuery) return "websearch";
  }

  if (msg.startsWith("search for ") && !msg.includes("job")) return "websearch";

  if (RESUME_MATCH_KEYWORDS.some((k) => msg.includes(k))) return "resume_job";
  if (resumeText && /\bmatch\b/.test(msg) && /\bjob/.test(msg)) return "resume_job";

  return "default";
};

export const MODE_LABELS = {
  default: "Default (CareerBot)",
  "job-scraper": "@server/job-scraper/",
  resume_job: "@server/resume_job/",
  websearch: "Web Search",
};
