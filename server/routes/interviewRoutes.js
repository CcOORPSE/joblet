import express from "express";
import Retell from "retell-sdk";
import { google } from "googleapis";
import { db } from "../config/firebaseAdmin.js";
import { protectRoute, protectCompany } from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

// GET /api/interviews/interviewers
router.get("/interviewers", async (req, res) => {
  try {
    // Return static interviewer profiles similar to FoloUp's interviewer DB seed
    const interviewers = [
      {
        id: 1,
        name: "Jessica - HR Specialist",
        description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        agent_id: process.env.RETELL_AGENT_HR || "agent_hr_mock",
        empathy: 9,
        exploration: 7,
        rapport: 9,
        speed: 6,
      },
      {
        id: 2,
        name: "David - Senior Tech Lead",
        description: "Engages in core technical concepts, systems design, and problem solving.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
        agent_id: process.env.RETELL_AGENT_TECH || "agent_tech_mock",
        empathy: 6,
        exploration: 9,
        rapport: 6,
        speed: 8,
      }
    ];
    return res.json({ success: true, interviewers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interviews/assign (Recruiter assigning to Candidate)
router.post("/assign", protectCompany, async (req, res) => {
  try {
    const { applicantId, applicantEmail, interviewerId, interviewerName, objective, scheduleTime } = req.body;
    const companyId = req.company?.uid || req.user?.uid;

    if (!applicantId || !interviewerId || !scheduleTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const interviewRef = await db.collection("interviews").add({
      applicantId,
      applicantEmail,
      interviewerId,
      interviewerName,
      objective: objective || "General Interview Session",
      scheduleTime,
      companyId,
      status: "assigned",
      createdAt: new Date().toISOString(),
    });

    // Sync to FoloUp Supabase database
    if (supabase) {
      try {
        const mappedInterviewerId = interviewerId === "agent_hr_mock" || interviewerId.includes("hr") ? 1 : 2;
        await supabase.from("interviewer").upsert([
          {
            id: 1,
            name: "Jessica - HR Specialist",
            description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            agent_id: "agent_hr_mock",
            empathy: 9,
            exploration: 7,
            rapport: 9,
            speed: 6,
          },
          {
            id: 2,
            name: "David - Senior Tech Lead",
            description: "Engages in core technical concepts, systems design, and problem solving.",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
            agent_id: "agent_tech_mock",
            empathy: 6,
            exploration: 9,
            rapport: 6,
            speed: 8,
          }
        ]);

        await supabase.from("interview").insert({
          id: interviewRef.id,
          name: `Mock Interview with ${interviewerName}`,
          description: objective || "General Interview Session",
          objective: objective || "General Interview Session",
          interviewer_id: mappedInterviewerId,
          is_active: true,
          questions: [
            { question: "Can you introduce yourself and describe your background?" },
            { question: "What are your key strengths in this domain?" },
            { question: "Describe a challenging problem you solved recently." }
          ],
          time_duration: "15"
        });
      } catch (sbError) {
        console.error("Supabase sync failed:", sbError.message);
      }
    }

    // Attempt Google Calendar Integration scheduling if token exists
    const recruiterTokenDoc = await db.collection("recruiter_tokens").doc(companyId).get();
    let calendarEventUrl = null;

    if (recruiterTokenDoc.exists) {
      try {
        if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id") {
          // Fallback to mock Google Calendar link
          calendarEventUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent("AI Mock Interview with " + interviewerName)}&details=${encodeURIComponent("Objective: " + (objective || "General Assessment"))}&dates=${new Date(scheduleTime).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(scheduleTime).getTime() + 30 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
          await interviewRef.update({ calendarEventUrl });
        } else {
          const tokens = recruiterTokenDoc.data();
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.BACKEND_URL || "http://localhost:3000"}/api/calendar/callback`
          );
          oauth2Client.setCredentials(tokens);

          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          const startDateTime = new Date(scheduleTime);
          const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes duration

          const event = {
            summary: `AI Mock Interview with ${interviewerName}`,
            description: `You have an automated voice assessment scheduled. Objective: ${objective}`,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
            attendees: [{ email: applicantEmail }],
            conferenceData: {
              createRequest: { requestId: `interview-${interviewRef.id}` },
            },
          };

          const response = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
            sendUpdates: "all",
          });

          calendarEventUrl = response.data.htmlLink;
          await interviewRef.update({ calendarEventUrl });
        }
      } catch (calError) {
        console.error("Google Calendar event creation failed:", calError.message);
      }
    }

    return res.json({ success: true, interviewId: interviewRef.id, calendarEventUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interviews/schedule-own (Applicant scheduling their own interview)
router.post("/schedule-own", protectRoute("user"), async (req, res) => {
  try {
    const { interviewerId, interviewerName, objective, scheduleTime } = req.body;
    const applicantId = req.user.uid;
    const applicantEmail = req.user.email;

    if (!interviewerId || !scheduleTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const interviewRef = await db.collection("interviews").add({
      applicantId,
      applicantEmail,
      interviewerId,
      interviewerName,
      objective: objective || "General Mock Interview",
      scheduleTime,
      companyId: "self", // Self scheduled
      status: "assigned",
      createdAt: new Date().toISOString(),
    });

    // Sync to FoloUp Supabase database
    if (supabase) {
      try {
        const mappedInterviewerId = interviewerId === "agent_hr_mock" || interviewerId.includes("hr") ? 1 : 2;
        await supabase.from("interviewer").upsert([
          {
            id: 1,
            name: "Jessica - HR Specialist",
            description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            agent_id: "agent_hr_mock",
            empathy: 9,
            exploration: 7,
            rapport: 9,
            speed: 6,
          },
          {
            id: 2,
            name: "David - Senior Tech Lead",
            description: "Engages in core technical concepts, systems design, and problem solving.",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
            agent_id: "agent_tech_mock",
            empathy: 6,
            exploration: 9,
            rapport: 6,
            speed: 8,
          }
        ]);

        await supabase.from("interview").insert({
          id: interviewRef.id,
          name: `Mock Interview with ${interviewerName}`,
          description: objective || "General Mock Interview",
          objective: objective || "General Mock Interview",
          interviewer_id: mappedInterviewerId,
          is_active: true,
          questions: [
            { question: "Can you introduce yourself and describe your background?" },
            { question: "What are your key strengths in this domain?" },
            { question: "Describe a challenging problem you solved recently." }
          ],
          time_duration: "15"
        });
      } catch (sbError) {
        console.error("Supabase sync failed:", sbError.message);
      }
    }

    // Attempt Google Calendar Integration scheduling if token exists
    const userTokenDoc = await db.collection("user_tokens").doc(applicantId).get();
    let calendarEventUrl = null;

    if (userTokenDoc.exists) {
      try {
        if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id") {
          // Fallback to mock Google Calendar link
          calendarEventUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent("AI Mock Interview with " + interviewerName)}&details=${encodeURIComponent("Objective: " + (objective || "General Mock Interview"))}&dates=${new Date(scheduleTime).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(scheduleTime).getTime() + 30 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
          await interviewRef.update({ calendarEventUrl });
        } else {
          const tokens = userTokenDoc.data();
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.BACKEND_URL || "http://localhost:3000"}/api/calendar/callback`
          );
          oauth2Client.setCredentials(tokens);

          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          const startDateTime = new Date(scheduleTime);
          const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes duration

          const event = {
            summary: `Self Mock Interview with ${interviewerName}`,
            description: `Your self-scheduled voice practice interview. Objective: ${objective}`,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
            attendees: [{ email: applicantEmail }],
            conferenceData: {
              createRequest: { requestId: `interview-${interviewRef.id}` },
            },
          };

          const response = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
            sendUpdates: "all",
          });

          calendarEventUrl = response.data.htmlLink;
          await interviewRef.update({ calendarEventUrl });
        }
      } catch (calError) {
        console.error("Google Calendar event creation failed:", calError.message);
      }
    }

    return res.json({ success: true, interviewId: interviewRef.id, calendarEventUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interviews/my-interviews (For applicant dashboard)
router.get("/my-interviews", protectRoute("user"), async (req, res) => {
  try {
    const applicantId = req.user.uid;
    const snapshot = await db.collection("interviews")
      .where("applicantId", "==", applicantId)
      .get();

    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ success: true, interviews: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interviews/register-call (Registering voice call through Retell)
router.post("/register-call", protectRoute("user"), async (req, res) => {
  try {
    const { agentId, interviewId } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, message: "Agent ID required" });
    }

    let registerCallResponse;
    if (process.env.RETELL_API_KEY) {
      registerCallResponse = await retellClient.call.createWebCall({
        agent_id: agentId,
      });
    } else {
      // Mock fallback if no API key is specified
      registerCallResponse = {
        call_id: "mock_call_" + Math.random().toString(36).substring(7),
        access_token: "mock_access_token_token",
      };
    }

    if (interviewId) {
      await db.collection("interviews").doc(interviewId).update({
        status: "completed",
        callId: registerCallResponse.call_id,
        completedAt: new Date().toISOString(),
      });
    }

    return res.json({ success: true, registerCallResponse });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
