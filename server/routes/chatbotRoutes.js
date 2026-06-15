import express from "express";
import { handleChatSession, parseResumePdf } from "../controller/chatbotController.js";
import { pdfUpload } from "../config/multer.js";

const router = express.Router();

// Send a chat message (with optional resume text in body)
router.post("/chat", handleChatSession);

// Parse a PDF resume and return extracted text
router.post("/parse-resume", pdfUpload.single("resume"), parseResumePdf);

export default router;
