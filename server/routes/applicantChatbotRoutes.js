import express from "express";
import {
  handleChatSession,
  parseResumePdf,
  listSessions,
  getSession,
  upsertSession,
} from "../controller/applicantChatbotController.js";
import { pdfUpload } from "../config/multer.js";

const router = express.Router();

router.post("/chat", handleChatSession);
router.post("/parse-resume", pdfUpload.single("resume"), parseResumePdf);
router.get("/sessions", listSessions);
router.get("/sessions/:sessionId", getSession);
router.post("/sessions", upsertSession);

export default router;
