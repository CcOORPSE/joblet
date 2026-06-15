import { db } from "../config/firebaseAdmin.js";
import admin from "../config/firebaseAdmin.js";
import { detectRecruiterIntent } from "../services/chat/intentDetector.js";
import { buildRecruiterSystemPrompt } from "../services/chat/recruiterPrompts.js";
import { resolveWorkingGeminiModel, getGenAI } from "../services/chat/geminiClient.js";
const MAX_SESSION_MESSAGES = 100;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const toIso = (val) => {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  if (typeof val === "number") return new Date(val).toISOString();
  return String(val);
};

const sessionTitleFromMessage = (message) => {
  const trimmed = (message || "").trim();
  if (!trimmed) return "HireBot conversation";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
};

const fetchCompanyMetrics = async (companyId) => {
  const weekAgo = Date.now() - WEEK_MS;

  const [jobsSnapshot, appsSnapshot] = await Promise.all([
    db.collection("jobs").where("companyId", "==", companyId).get(),
    db.collection("applications").where("companyId", "==", companyId).get(),
  ]);

  let totalApplications = 0;
  let applicationsThisWeek = 0;
  let pendingReview = 0;
  let interviews = 0;

  appsSnapshot.forEach((doc) => {
    const app = doc.data();
    totalApplications += 1;
    if ((app.date || 0) >= weekAgo) applicationsThisWeek += 1;
    const status = (app.status || "pending").toLowerCase();
    if (["pending", "applied", "review"].includes(status)) pendingReview += 1;
    if (status === "interview") interviews += 1;
  });

  const openJobs = jobsSnapshot.docs.filter((d) => d.data().visible !== false).length;

  return {
    totalApplications,
    applicationsThisWeek,
    pendingReview,
    interviews,
    openJobs,
    jobsSnapshot,
    appsSnapshot,
  };
};

const fetchApplicationsList = (appsSnapshot, limit = 15) => {
  const apps = [];
  appsSnapshot.forEach((doc) => {
    const data = doc.data();
    apps.push({
      id: doc.id,
      name: data.userDetails?.name || "Applicant",
      jobTitle: data.jobDetails?.title || "Role",
      status: data.status || "pending",
      appliedDate: data.date ? new Date(data.date).toLocaleDateString() : "Unknown",
      jobId: data.jobId,
    });
  });
  return apps.sort((a, b) => (b.appliedDate > a.appliedDate ? 1 : -1)).slice(0, limit);
};

const fetchJobPerformance = (jobsSnapshot, appsSnapshot) => {
  const counts = {};
  appsSnapshot.forEach((doc) => {
    const jobId = doc.data().jobId;
    if (jobId) counts[jobId] = (counts[jobId] || 0) + 1;
  });

  return jobsSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      title: doc.data().title || "Untitled",
      applicantCount: counts[doc.id] || 0,
      visible: doc.data().visible !== false,
    }))
    .sort((a, b) => b.applicantCount - a.applicantCount);
};

const persistRecruiterTurn = async (companyId, sessionId, userMessage, assistantReply) => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const newEntries = [
    { role: "user", content: userMessage, createdAt: Date.now() },
    { role: "assistant", content: assistantReply, createdAt: Date.now() },
  ];

  if (sessionId) {
    const ref = db.collection("chat_sessions").doc(sessionId);
    const doc = await ref.get();
    if (doc.exists && doc.data().userId === companyId && doc.data().role === "recruiter") {
      const existing = doc.data().messages || [];
      const messages = [...existing, ...newEntries].slice(-MAX_SESSION_MESSAGES);
      await ref.update({ messages, updatedAt: now });
      return sessionId;
    }
  }

  const ref = await db.collection("chat_sessions").add({
    userId: companyId,
    role: "recruiter",
    title: sessionTitleFromMessage(userMessage),
    messages: newEntries,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const handleRecruiterChat = async (req, res) => {
  try {
    const { message, history = [], sessionId: incomingSessionId } = req.body;
    const companyId = req.company.uid || req.company._id;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const intent = detectRecruiterIntent(message);
    const metricsData = await fetchCompanyMetrics(companyId);

    const context = {
      metrics: {
        totalApplications: metricsData.totalApplications,
        applicationsThisWeek: metricsData.applicationsThisWeek,
        pendingReview: metricsData.pendingReview,
        interviews: metricsData.interviews,
        openJobs: metricsData.openJobs,
      },
      applications: [],
      jobs: metricsData.jobsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
      jobPerformance: [],
    };

    if (intent === "APPLICANT_SCREEN" || intent === "PIPELINE_SUMMARY") {
      context.applications = fetchApplicationsList(metricsData.appsSnapshot);
    }
    if (intent === "JOB_PERFORMANCE") {
      context.jobPerformance = fetchJobPerformance(metricsData.jobsSnapshot, metricsData.appsSnapshot);
    }

    const systemPrompt = buildRecruiterSystemPrompt(intent, context);
    const modelName = await resolveWorkingGeminiModel();
    const model = getGenAI().getGenerativeModel({ model: modelName });

    const geminiHistory = history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood! I'm HireBot, your hiring assistant. I can summarize your pipeline, help screen candidates, draft job posts, and analyze listing performance. How can I help?",
            },
          ],
        },
        ...geminiHistory,
      ],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.5,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    const sessionId = await persistRecruiterTurn(
      companyId,
      incomingSessionId,
      message.trim(),
      responseText
    );

    return res.json({
      success: true,
      reply: responseText,
      intent,
      sessionId,
      metrics: context.metrics,
    });
  } catch (error) {
    console.error("Recruiter chat error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listRecruiterSessions = async (req, res) => {
  try {
    const companyId = req.company.uid || req.company._id;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const snapshot = await db
      .collection("chat_sessions")
      .where("userId", "==", companyId)
      .where("role", "==", "recruiter")
      .get();

    const sessions = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "Conversation",
          messageCount: (data.messages || []).length,
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
          _sort: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
        };
      })
      .sort((a, b) => b._sort - a._sort)
      .slice(0, limit)
      .map(({ _sort, ...rest }) => rest);

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecruiterSession = async (req, res) => {
  try {
    const companyId = req.company.uid || req.company._id;
    const { sessionId } = req.params;

    const doc = await db.collection("chat_sessions").doc(sessionId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const data = doc.data();
    if (data.userId !== companyId || data.role !== "recruiter") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({
      success: true,
      session: {
        id: doc.id,
        title: data.title,
        messages: (data.messages || []).map(({ role, content }) => ({ role, content })),
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
