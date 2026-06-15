const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "have", "has", "was", "were",
  "are", "been", "being", "will", "would", "could", "should", "about", "into", "your",
  "you", "our", "their", "they", "them", "his", "her", "she", "him", "its", "not",
  "but", "can", "all", "any", "may", "who", "how", "what", "when", "where", "which",
  "years", "year", "experience", "work", "working", "using", "used", "also", "well",
]);

export const extractKeywords = (text) => {
  if (!text) return [];
  const seen = new Set();
  const keywords = [];

  for (const raw of text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").split(/\s+/)) {
    const word = raw.trim();
    if (word.length < 3 || STOP_WORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    keywords.push(word);
  }

  return keywords;
};

export const scoreJobMatch = (resumeKeywords, job) => {
  const jobText = `${job.title} ${job.description} ${job.category} ${job.level}`.toLowerCase();
  const titleLower = (job.title || "").toLowerCase();
  const matched = [];
  let score = 0;

  for (const kw of resumeKeywords) {
    if (jobText.includes(kw)) {
      score += kw.length > 5 ? 2 : 1;
      matched.push(kw);
      if (titleLower.includes(kw)) score += 3;
    }
  }

  return { score, matched: [...new Set(matched)] };
};

export const matchResumeToJobs = (resumeText, jobs, topN = 3) => {
  const keywords = extractKeywords(resumeText);
  if (keywords.length === 0) return [];

  return jobs
    .map((job) => {
      const { score, matched } = scoreJobMatch(keywords, job);
      return { job, score, matched };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

export const formatResumeMatchResponse = (matches) => {
  if (matches.length === 0) {
    return "No strong job matches found based on keyword overlap with your resume. Try attaching a more detailed resume, or switch to **Default (CareerBot)** mode for AI-powered matching.";
  }

  let response = `**Resume Match Results** — Found **${matches.length}** matching job(s):\n\n`;

  for (const { job, score, matched } of matches) {
    const pct = Math.min(95, Math.max(40, Math.round((score / Math.max(matched.length * 3, 1)) * 100)));
    response += `[JOB_CARD:${job._id}]\n`;
    response += `[SCORE_BADGE:${pct}]\n`;
    response += `- **${job.title}** @ ${job.companyName} (${job.location})\n`;
    response += `- Matching skills: ${matched.slice(0, 8).join(", ")}\n\n`;
  }

  return response.trim();
};

/** Pull usable text from stored resume analysis feedback when no PDF is attached. */
export const extractTextFromFeedback = (feedback) => {
  if (!feedback || typeof feedback !== "object") return "";
  const parts = [];

  const walk = (value) => {
    if (typeof value === "string") parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };

  walk(feedback);
  return parts.join(" ");
};
