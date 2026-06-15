import express from "express";
import {
  handleRecruiterChat,
  listRecruiterSessions,
  getRecruiterSession,
} from "../controller/recruiterChatbotController.js";

const router = express.Router();

router.post("/chat", handleRecruiterChat);
router.get("/sessions", listRecruiterSessions);
router.get("/sessions/:sessionId", getRecruiterSession);

export default router;
