import { db, firebaseInitError } from "../config/firebaseAdmin.js";
import { uploadResumeFile, getSignedResumeUrl } from "../utils/uploadResumeFile.js";
import { logActivity } from "../services/chat/activityLogger.js";

const withFreshResumeUrl = async (userData) => {
  if (userData.resumeStoragePath) {
    const freshUrl = await getSignedResumeUrl(userData.resumeStoragePath);
    if (freshUrl) userData.resume = freshUrl;
  }
  return userData;
};

// Get user Data (or auto-create if new user logging in first time)
export const getUserData = async (req, res) => {
  if (!db) {
    console.error("[UserController] Firebase Firestore not initialized in getUserData", { firebaseInitError });
    return res.status(503).json({
      success: false,
      message: "Database not initialized. Please check your Firebase configuration.",
      debug: { firebaseError: firebaseInitError }
    });
  }

  const userId = req.user.uid;

  try {
    let userDoc = await db.collection("users").doc(userId).get();

    // If profile document doesn't exist yet, auto-create it using credentials from token
    if (!userDoc.exists) {
      const displayName = req.user.name || req.user.email.split("@")[0];
      const newUser = {
        name: displayName,
        email: req.user.email,
        resume: "",
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=150`,
        role: "user"
      };
      await db.collection("users").doc(userId).set(newUser);
      userDoc = await db.collection("users").doc(userId).get();
    }

    const userData = await withFreshResumeUrl({ _id: userDoc.id, ...userDoc.data() });
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error("[UserController] Error in getUserData", {
      error: error.message,
      userId: req.user?.uid
    });
    res.status(500).json({
      success: false,
      message: error.message,
      debug: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  if (!db) {
    console.error("[UserController] Firebase Firestore not initialized in applyForJob", { firebaseInitError });
    return res.status(503).json({
      success: false,
      message: "Database not initialized. Please check your Firebase configuration.",
      debug: { firebaseError: firebaseInitError }
    });
  }

  const { jobId } = req.body;
  const userId = req.user.uid;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ success: false, message: "Valid jobId is required" });
  }

  try {
    // Check if already applied
    const existingAppSnapshot = await db.collection("applications")
      .where("userId", "==", userId)
      .where("jobId", "==", jobId)
      .get();

    if (!existingAppSnapshot.empty) {
      return res.json({
        success: false,
        message: "You have already applied for this job"
      });
    }

    const jobDoc = await db.collection("jobs").doc(jobId).get();
    if (!jobDoc.exists) {
      return res.json({ success: false, message: "Job not found" });
    }

    const jobData = jobDoc.data();

    if (jobData.visible === false) {
      return res.status(400).json({ success: false, message: "This job is no longer accepting applications" });
    }
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const newApplication = {
      companyId: jobData.companyId,
      userId,
      jobId,
      date: Date.now(),
      status: "pending",
      // Denormalized snapshots for fast single-document retrievals
      jobDetails: {
        title: jobData.title,
        location: jobData.location,
        category: jobData.category,
        level: jobData.level,
        salary: jobData.salary
      },
      userDetails: {
        name: userData.name || "Anonymous User",
        email: userData.email || "",
        image: userData.image || "",
        resume: userData.resume || "",
        resumeStoragePath: userData.resumeStoragePath || ""
      }
    };

    const docRef = await db.collection("applications").add(newApplication);

    await logActivity(userId, "application_submitted", {
      metadata: {
        jobId,
        applicationId: docRef.id,
        jobTitle: jobData.title,
        companyId: jobData.companyId,
      },
    });

    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    console.error("[UserController] Error in applyForJob", {
      error: error.message,
      userId: req.user?.uid,
      jobId: req.body?.jobId
    });
    res.status(500).json({
      success: false,
      message: error.message,
      debug: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  if (!db) {
    console.error("[UserController] Firebase Firestore not initialized in getUserJobApplications", { firebaseInitError });
    return res.status(503).json({
      success: false,
      message: "Database not initialized. Please check your Firebase configuration.",
      debug: { firebaseError: firebaseInitError }
    });
  }

  try {
    const userId = req.user.uid;

    const applicationsSnapshot = await db.collection("applications")
      .where("userId", "==", userId)
      .get();

    const applications = [];
    applicationsSnapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        _id: doc.id,
        ...data,
        // Mimic old Mongoose populate structure
        companyId: {
          _id: data.companyId,
          name: data.jobDetails?.title ? "Company" : "Unknown",
          email: "",
          image: ""
        },
        jobId: {
          _id: data.jobId,
          title: data.jobDetails?.title || "",
          location: data.jobDetails?.location || "",
          level: data.jobDetails?.level || "",
          salary: data.jobDetails?.salary || "",
          description: data.jobDetails?.description || ""
        }
      });
    });

    res.json({ success: true, applications });
  } catch (error) {
    console.error("[UserController] Error in getUserJobApplications", {
      error: error.message,
      userId: req.user?.uid
    });
    res.status(500).json({
      success: false,
      message: error.message,
      debug: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  if (!db) {
    console.error("[UserController] Firebase Firestore not initialized in updateUserResume", { firebaseInitError });
    return res.status(503).json({
      success: false,
      message: "Database not initialized. Please check your Firebase configuration.",
      debug: { firebaseError: firebaseInitError }
    });
  }

  try {
    const userId = req.user.uid;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.json({ success: false, message: "No file uploaded" });
    }
    const resumeUpload = await uploadResumeFile(resumeFile);
    
    await db.collection("users").doc(userId).update({
      resume: resumeUpload.url,
      resumeStoragePath: resumeUpload.storagePath,
    });

    await logActivity(userId, "resume_uploaded", {
      metadata: { resumeUrl: resumeUpload.url },
    });

    return res.json({ success: true, message: "Resume Updated Successfully" });
  } catch (error) {
    console.error("[UserController] Error in updateUserResume", {
      error: error.message,
      userId: req.user?.uid
    });
    return res.status(500).json({
      success: false,
      message: error.message,
      debug: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
