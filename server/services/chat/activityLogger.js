import { db } from "../../config/firebaseAdmin.js";
import admin from "../../config/firebaseAdmin.js";

const defaultTitles = {
  login: "Signed in",
  chat_message: "Sent a chat message",
  resume_uploaded: "Resume updated",
  resume_analyzed: "ATS scan completed",
  application_submitted: "Submitted an application",
  application_status_changed: "Application status updated",
  job_saved: "Saved a job",
};

export function defaultTitle(type, metadata = {}) {
  switch (type) {
    case "application_submitted":
      return metadata.jobTitle
        ? `Applied to ${metadata.jobTitle}`
        : "Applied to a job";
    case "application_status_changed":
      return metadata.jobTitle
        ? `${metadata.companyName || "Employer"} updated ${metadata.jobTitle} — ${metadata.status || "status changed"}`
        : "Application status changed";
    case "resume_analyzed":
      return metadata.score != null
        ? `ATS scan completed — ${metadata.score}/100`
        : "ATS scan completed";
    case "chat_message":
      return metadata.preview
        ? `Asked: ${metadata.preview}`
        : "Sent a chat message";
    default:
      return defaultTitles[type] || "Activity recorded";
  }
}

export async function logActivity(userId, type, { title, metadata } = {}) {
  if (!userId || !type) return;

  try {
    await db.collection("activity_logs").add({
      userId,
      type,
      title: title || defaultTitle(type, metadata),
      metadata: metadata || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("activityLogger:", err.message);
  }
}
