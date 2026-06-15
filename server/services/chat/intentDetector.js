export const detectApplicantIntent = (message) => {
  const msg = message.toLowerCase();

  const atsKeywords = [
    "ats", "scan", "score", "rate my resume", "analyze my resume", "check my resume",
    "how is my resume", "resume score", "ats score", "resume analysis", "ats check",
  ];
  const jobKeywords = [
    "find job", "job match", "matching job", "suitable job", "job for me", "what role",
    "recommend job", "job recommendation", "jobs for me", "job search", "find me a job",
    "show me jobs", "what jobs", "remote job", "remote jobs", "remote developer",
  ];
  const adviceKeywords = [
    "improve", "rewrite", "how to", "tips", "advice", "suggest", "better", "fix my",
    "feedback", "what should", "career advice", "resume advice", "interview", "cover letter",
  ];

  if (atsKeywords.some((k) => msg.includes(k))) return "ATS_SCAN";
  if (jobKeywords.some((k) => msg.includes(k))) return "JOB_MATCH";
  if (adviceKeywords.some((k) => msg.includes(k))) return "CAREER_ADVICE";
  return "GENERAL";
};

export const detectRecruiterIntent = (message) => {
  const msg = message.toLowerCase();

  const pipelineKeywords = [
    "pipeline", "how many applicant", "applications this week", "applicant summary",
    "pipeline summary", "total applications", "applications count", "need review",
    "pending applications", "show applications that need",
  ];
  const screenKeywords = [
    "top candidate", "best applicant", "who applied", "screen candidate",
    "applicants for", "candidates for", "review applicant",
  ];
  const perfKeywords = [
    "most popular job", "best performing", "job performance", "most applicant",
    "which job", "top job", "listing performance",
  ];
  const jdKeywords = [
    "write a job", "draft job", "job post", "job description", "create a listing",
    "write a listing", "draft description",
  ];

  if (pipelineKeywords.some((k) => msg.includes(k))) return "PIPELINE_SUMMARY";
  if (screenKeywords.some((k) => msg.includes(k))) return "APPLICANT_SCREEN";
  if (perfKeywords.some((k) => msg.includes(k))) return "JOB_PERFORMANCE";
  if (jdKeywords.some((k) => msg.includes(k))) return "JD_GENERATOR";
  return "GENERAL_HR";
};
