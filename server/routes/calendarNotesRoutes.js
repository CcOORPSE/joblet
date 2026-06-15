import express from "express";
import {
  getNotesAndReminders,
  saveNotesAndReminders,
  toggleGoogleCalendar,
  getCalendarEvents
} from "../controller/calendarNotesController.js";
import { protectRoute, protectCompany } from "../middleware/authMiddleware.js";
import { auth } from "../config/firebaseAdmin.js";

const router = express.Router();

// Hybrid middleware to handle either applicant (user) or recruiter (company)
const hybridAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (decodedToken.role === "recruiter") {
      req.company = {
        _id: decodedToken.uid,
        uid: decodedToken.uid,
        name: decodedToken.name || "Recruiter",
        email: decodedToken.email,
        role: decodedToken.role
      };
    } else {
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || "user",
        name: decodedToken.name || ""
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

router.get("/notes/:jobId", hybridAuth, getNotesAndReminders);
router.post("/notes", hybridAuth, saveNotesAndReminders);
router.post("/sync-calendar", hybridAuth, toggleGoogleCalendar);
router.get("/events", hybridAuth, getCalendarEvents);

export default router;
