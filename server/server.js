import "./config/loadEnv.js";
import './config/instrument.js'
import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import applicantChatbotRoutes from './routes/applicantChatbotRoutes.js';
import recruiterChatbotRoutes from './routes/recruiterChatbotRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import calendarNotesRoutes from './routes/calendarNotesRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import googleCalendarRoutes from './routes/googleCalendarRoutes.js';
import { protectRoute, protectCompany } from './middleware/authMiddleware.js';
import { chatRateLimiter } from './middleware/rateLimiters.js';
import { db, firebaseInitError } from './config/firebaseAdmin.js';

// Initialize Express
const app = express();

// Enable trust proxy for express-rate-limit behind Vercel proxy
app.set("trust proxy", 1);

// Lazy Cloudinary Init — non-blocking, safe for serverless cold starts
connectCloudinary().catch((err) =>
  console.warn("[Cloudinary] Init failed (non-fatal):", err.message)
);

// CORS — allow same-origin (Vercel), localhost dev, and any explicit FRONTEND_URL list
const rawOrigins = process.env.FRONTEND_URL || "";
const explicitOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman, same-origin SSR)
      if (!origin) return callback(null, true);

      // Allow localhost for local development
      if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        return callback(null, true);
      }

      // Allow any *.vercel.app domain (covers all your preview + prod deployments)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Allow explicitly listed origins
      if (explicitOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/", (req, res) => res.send("API Working with Firebase"));

app.get("/api/debug-firebase-init", (req, res) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const obscGemini = geminiKey ? `${geminiKey.substring(0, 5)}...${geminiKey.substring(geminiKey.length - 5)}` : "missing";
    
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const saLength = serviceAccountJson ? serviceAccountJson.length : 0;
    
    let saProject = "unknown";
    let saPrivateKeyFormat = "unknown";
    
    if (serviceAccountJson) {
      try {
        let jsonStr = serviceAccountJson.trim();
        if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
          jsonStr = jsonStr.slice(1, -1);
        }
        const parsed = JSON.parse(jsonStr);
        saProject = parsed.project_id || "missing";
        saPrivateKeyFormat = parsed.private_key ? (parsed.private_key.includes("-----BEGIN PRIVATE KEY-----") ? "valid header" : "invalid header") : "missing key";
      } catch (err) {
        saProject = `parse error: ${err.message}`;
      }
    }

    res.json({
      success: true,
      firebaseInitError,
      dbInitialized: db !== null,
      env: {
        NODE_ENV: process.env.NODE_ENV || "not set",
        VERCEL: process.env.VERCEL || "not set",
        PORT: process.env.PORT || "not set",
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "not set",
        FRONTEND_URL: process.env.FRONTEND_URL || "not set",
        GEMINI_API_KEY_OBSCURED: obscGemini,
        FIREBASE_SERVICE_ACCOUNT_JSON_LENGTH: saLength,
        SA_PROJECT_ID: saProject,
        SA_PRIVATE_KEY_FORMAT: saPrivateKeyFormat
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Comprehensive configuration debug endpoint
app.get("/api/debug-config", (req, res) => {
  try {
    const hasFirebaseProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasFirebaseClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasFirebasePrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasFrontendUrl = !!process.env.FRONTEND_URL;

    const geminiKeyValid = hasGeminiKey && 
      (process.env.GEMINI_API_KEY.startsWith("AIza") || 
       process.env.GEMINI_API_KEY.startsWith("AQ"));

    const allConfigured = hasFirebaseProjectId && 
                          hasFirebaseClientEmail && 
                          hasFirebasePrivateKey && 
                          hasGeminiKey &&
                          hasFrontendUrl;

    res.json({
      success: true,
      status: allConfigured ? "READY" : "INCOMPLETE",
      firebaseInitialized: db !== null,
      firebaseInitError: firebaseInitError || null,
      configuration: {
        firebase: {
          project_id: hasFirebaseProjectId ? "✅ SET" : "❌ MISSING",
          client_email: hasFirebaseClientEmail ? "✅ SET" : "❌ MISSING",
          private_key: hasFirebasePrivateKey ? "✅ SET" : "❌ MISSING",
          storage_bucket: process.env.FIREBASE_STORAGE_BUCKET || "❌ MISSING"
        },
        gemini: {
          api_key: hasGeminiKey ? (geminiKeyValid ? "✅ VALID" : "⚠️ INVALID FORMAT") : "❌ MISSING",
          key_format: geminiKeyValid ? "valid" : "invalid"
        },
        deployment: {
          node_env: process.env.NODE_ENV || "production",
          vercel: process.env.VERCEL ? "✅ YES" : "❌ NO",
          frontend_url: hasFrontendUrl ? "✅ SET" : "❌ MISSING"
        }
      },
      endpoints: {
        sessions: db !== null ? "✅ READY" : "❌ UNAVAILABLE",
        chat: db !== null && hasGeminiKey ? "✅ READY" : "❌ UNAVAILABLE",
        parse_resume: db !== null ? "✅ READY" : "❌ UNAVAILABLE"
      },
      recommendations: !allConfigured ? [
        !hasFirebaseProjectId && "Set FIREBASE_PROJECT_ID on Vercel",
        !hasFirebaseClientEmail && "Set FIREBASE_CLIENT_EMAIL on Vercel",
        !hasFirebasePrivateKey && "Set FIREBASE_PRIVATE_KEY on Vercel",
        !hasGeminiKey && "Set GEMINI_API_KEY on Vercel",
        !hasFrontendUrl && "Set FRONTEND_URL on Vercel"
      ].filter(Boolean) : ["All systems configured"]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
});

// Mount modular sub-routes
app.use('/api/company', companyRoutes)
app.use('/api/jobs', JobRoutes)
app.use('/api/users', protectRoute("user"), userRoutes)
app.use('/api/resumes', protectRoute("user"), resumeRoutes)
app.use('/api/chatbot/applicant', chatRateLimiter, protectRoute("user"), applicantChatbotRoutes)
app.use('/api/chatbot/recruiter', chatRateLimiter, protectCompany, recruiterChatbotRoutes)
app.use('/api/activity', protectRoute("user"), activityRoutes)
app.use('/api/chatbot', chatRateLimiter, protectRoute("user"), chatbotRoutes)
app.use('/api/calendar-notes', calendarNotesRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/calendar', googleCalendarRoutes)

// Unified Admin Route for `/admin`
app.get('/api/admin/metrics', protectRoute("admin"), async (req, res) => {
  try {
    const jobsSnapshot = await db.collection("jobs").get();
    const usersSnapshot = await db.collection("users").get();
    const appsSnapshot = await db.collection("applications").get();

    res.json({
      success: true,
      metrics: {
        totalJobs: jobsSnapshot.size,
        totalUsers: usersSnapshot.size,
        totalApplications: appsSnapshot.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

Sentry.setupExpressErrorHandler(app);

// Start the server locally only — Vercel exports the app as a handler
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

// Export as default for Vercel serverless function handler
export default app;

