import express from "express";
import { analyzeResume, getUserResumes, getResumeDetail } from "../controller/resumeController.js";
import { pdfUpload } from "../config/multer.js";

const router = express.Router();

// Analyze and upload resume
router.post("/analyze-resume", pdfUpload.single("resume"), analyzeResume);

// Get all previous analyses for current user
router.get("/", getUserResumes);

// Get specific analysis report
router.get("/:id", getResumeDetail);

export default router;
