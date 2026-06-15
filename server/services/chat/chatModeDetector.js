/**
 * Detect the best chat mode from message content.
 * Specialized modes (job-scraper, resume_job, websearch) are tried first;
 * returns "default" only when no specialized mode applies.
 */

const SCRAPER_PREFIX = /@server\/job-scraper\//i;
const RESUME_PREFIX = /@server\/resume_job\//i;

const SCRAPER_KEYWORDS = [
  "scrape job",
  "scrape jobs",
  "live scrape",
  "job scraper",
  "run scraper",
  "run job scraper",
  "search linkedin",
  "search mycareersfuture",
  "scrape linkedin",
  "fetch live jobs",
  "scrape for jobs",
];

const WEBSEARCH_KEYWORDS = [
  "web search",
  "search the web",
  "look up online",
  "search online",
  "latest news about",
  "what's trending",
  "look up ",
  "google search",
  "bing search",
];

const RESUME_MATCH_KEYWORDS = [
  "match my resume",
  "match resume",
  "resume match",
  "match me to",
  "match me with",
  "jobs for my resume",
  "match jobs against",
  "which jobs fit",
  "best jobs for me",
  "compare my resume",
  "match my profile",
];

/**
 * @param {string} message
 * @param {{ resumeText?: string, currentMode?: string }} [options]
 * @returns {"default"|"job-scraper"|"resume_job"|"websearch"}
 */
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

export const stripModePrefix = (message, mode) => {
  let cleaned = (message || "").trim();
  if (mode === "job-scraper") {
    cleaned = cleaned.replace(SCRAPER_PREFIX, "").trim();
  } else if (mode === "resume_job") {
    cleaned = cleaned.replace(RESUME_PREFIX, "").trim();
  } else if (mode === "websearch") {
    cleaned = cleaned.replace(/web search/gi, "").trim();
  }
  return cleaned;
};
