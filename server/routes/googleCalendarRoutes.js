import express from "express";
import { google } from "googleapis";
import { db } from "../config/firebaseAdmin.js";
import { protectRoute, protectCompany } from "../middleware/authMiddleware.js";

const router = express.Router();

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
    process.env.GOOGLE_CLIENT_SECRET || "MOCK_CLIENT_SECRET",
    `${process.env.BACKEND_URL || "http://localhost:3000"}/api/calendar/callback`
  );
};

// GET /api/calendar/auth
router.get("/auth", protectRoute("user"), (req, res) => {
  const userId = req.user?.uid;
  const role = req.user?.role || "user";
  const redirectTo = req.query.redirect_to || "";

  // If client credentials are not configured, perform mock callback redirect
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id") {
    const callbackUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/calendar/callback?code=mock_oauth_code&state=${role}:${userId}:${encodeURIComponent(redirectTo)}`;
    return res.json({ success: true, authUrl: callbackUrl });
  }

  try {
    const oauth2Client = getOAuthClient();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: `${role}:${userId}:${redirectTo}`,
      prompt: "consent",
    });

    return res.json({ success: true, authUrl });
  } catch (err) {
    // If googleapis throws error due to bad/missing config, fallback to mock redirect
    const callbackUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/calendar/callback?code=mock_oauth_code&state=${role}:${userId}:${encodeURIComponent(redirectTo)}`;
    return res.json({ success: true, authUrl: callbackUrl });
  }
});

// GET /api/calendar/callback
router.get("/callback", async (req, res) => {
  const { code, state } = req.query; // state holds the "role:userId" or fallback to companyId
  if (!code || !state) {
    return res.status(400).send("Invalid callback payload. Missing parameters.");
  }

  try {
    let role = "recruiter";
    let userId = state;
    let redirectPath = "";

    if (state.includes(":")) {
      const parts = state.split(":");
      role = parts[0];
      userId = parts[1];
      if (parts[2]) {
        redirectPath = decodeURIComponent(parts[2]);
      }
    }

    let tokens = {
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      expiry_date: Date.now() + 3600 * 1000
    };

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id" && code !== "mock_oauth_code") {
      const oauth2Client = getOAuthClient();
      const response = await oauth2Client.getToken(code);
      tokens = response.tokens;
    }

    // Save tokens in Firestore associated with the recruiter or user ID
    if (role === "recruiter") {
      await db.collection("recruiter_tokens").doc(userId).set(tokens, { merge: true });
      await db.collection("companies").doc(userId).update({ calendarConnected: true }).catch(() => {});
    } else {
      await db.collection("user_tokens").doc(userId).set(tokens, { merge: true });
      await db.collection("users").doc(userId).update({ calendarConnected: true }).catch(() => {});
    }

    // Redirect user back to dashboard or applicant prep page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    if (!redirectPath) {
      redirectPath = role === "recruiter" ? "/dashboard/assign-interview" : "/app/preparation";
    }
    return res.redirect(`${frontendUrl}${redirectPath}${redirectPath.includes("?") ? "&" : "?"}calendar_auth=success`);
  } catch (error) {
    return res.status(500).send(`Authentication error: ${error.message}`);
  }
});

export default router;
