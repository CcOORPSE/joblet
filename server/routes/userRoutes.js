import express from "express";
import { applyForJob, getUserData, getUserJobApplications, updateUserResume } from "../controller/userController.js";
import { pdfUpload } from "../config/multer.js";

const router = express.Router();

// Get User Data

router.get("/user", getUserData)

// Apply for a Job

router.post("/apply", applyForJob)

// Get applied jobs data
router.get("/applications", getUserJobApplications)

// Update the resume

router.post('/update-resume', pdfUpload.single("resume"), updateUserResume)


export default router;