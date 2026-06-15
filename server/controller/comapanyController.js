import { db, auth } from "../config/firebaseAdmin.js";
import { uploadCompanyLogo } from "../utils/uploadCompanyLogo.js";
import { getSignedResumeUrl } from "../utils/uploadResumeFile.js";
import { logActivity } from "../services/chat/activityLogger.js";

// Register a new Company/Recruiter via Firebase Auth
export const registerCompany = async (req, res) => {
  const { name, email, password } = req.body;
  const imageFile = req.file; // Logo is optional

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Name, email and password are required" });
  }

  try {
    // Attempt logo upload — gracefully fall back to empty string if not provided or upload fails
    let imageUrl = "";
    if (imageFile) {
      try {
        imageUrl = await uploadCompanyLogo(imageFile);
      } catch (uploadError) {
        console.warn("[registerCompany] Logo upload failed (non-fatal):", uploadError.message);
        // Continue registration without a logo
      }
    }

    // Create recruiter in Firebase Auth
    const createUserPayload = {
      email,
      password,
      displayName: name,
    };
    if (imageUrl) createUserPayload.photoURL = imageUrl;

    const userRecord = await auth.createUser(createUserPayload);

    // Set custom claim role = "recruiter"
    await auth.setCustomUserClaims(userRecord.uid, { role: "recruiter" });

    // Store company profile in Firestore
    const companyData = {
      name,
      email,
      image: imageUrl,
      role: "recruiter"
    };
    await db.collection("companies").doc(userRecord.uid).set(companyData);

    // Mint a custom Firebase token for direct login integration
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      success: true,
      company: {
        _id: userRecord.uid,
        name,
        email,
        image: imageUrl,
      },
      token: customToken // Recruiter signs in using this custom token on client
    });
  } catch (error) {
    if (error.code === "STORAGE_BUCKET_NOT_FOUND" || /bucket/i.test(error.message)) {
      return res.status(503).json({
        success: false,
        message: error.message,
        setupRequired: "firebase_storage",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Company Login Integration (requires a verified Firebase ID token in Authorization header)
export const loginCompany = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userRecord = await auth.getUser(decodedToken.uid);

    const companyDoc = await db.collection("companies").doc(userRecord.uid).get();
    if (!companyDoc.exists) {
      return res.status(403).json({ success: false, message: "Recruiter account not found" });
    }

    const companyData = companyDoc.data();
    if (companyData.role !== "recruiter") {
      return res.status(403).json({ success: false, message: "Forbidden: Recruiter access required" });
    }

    res.json({
      success: true,
      company: {
        _id: userRecord.uid,
        name: companyData.name,
        email: companyData.email,
        image: companyData.image || userRecord.photoURL
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Recruiter account login failed. Please sign in again." });
  }
};

// Get company data
export const getCompanyData = async (req, res) => {
  try {
    const companyId = req.company.uid || req.company._id;
    const companyDoc = await db.collection("companies").doc(companyId).get();

    if (!companyDoc.exists) {
      return res.json({ success: false, message: "Company profile not found" });
    }

    res.json({ success: true, company: { _id: companyDoc.id, ...companyDoc.data() } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Post a new Job
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;
  const companyId = req.company.uid || req.company._id;

  try {
    const companyDoc = await db.collection("companies").doc(companyId).get();
    const companyData = companyDoc.exists ? companyDoc.data() : { name: req.company.name, image: "" };

    const newJob = {
      title,
      description,
      location,
      salary: Number(salary),
      companyId,
      date: Date.now(),
      level,
      category,
      visible: true,
      // Denormalized company metadata snapshot for client-side feeds
      companyIdDetails: {
        name: companyData.name || "Company",
        image: companyData.image || ""
      }
    };

    const docRef = await db.collection("jobs").add(newJob);

    res.json({ success: true, newJob: { _id: docRef.id, ...newJob } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  const companyId = req.company.uid || req.company._id;

  try {
    const appsSnapshot = await db.collection("applications")
      .where("companyId", "==", companyId)
      .get();

    const applications = [];
    for (const doc of appsSnapshot.docs) {
      const data = doc.data();
      let resumeUrl = data.userDetails?.resume || "";
      if (data.userDetails?.resumeStoragePath) {
        const fresh = await getSignedResumeUrl(data.userDetails.resumeStoragePath);
        if (fresh) resumeUrl = fresh;
      }
      applications.push({
        _id: doc.id,
        ...data,
        userId: {
          _id: data.userId,
          name: data.userDetails?.name || "Applicant",
          email: data.userDetails?.email || "",
          image: data.userDetails?.image || "",
          resume: resumeUrl
        },
        jobId: {
          _id: data.jobId,
          title: data.jobDetails?.title || "",
          location: data.jobDetails?.location || "",
          category: data.jobDetails?.category || "",
          level: data.jobDetails?.level || "",
          salary: data.jobDetails?.salary || ""
        }
      });
    }

    res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  const companyId = req.company.uid || req.company._id;

  try {
    const jobsSnapshot = await db.collection("jobs")
      .where("companyId", "==", companyId)
      .get();

    const jobsData = [];
    for (const doc of jobsSnapshot.docs) {
      const job = doc.data();
      
      // Calculate applicants count
      const appsSnapshot = await db.collection("applications")
        .where("jobId", "==", doc.id)
        .get();

      jobsData.push({
        _id: doc.id,
        ...job,
        applicants: appsSnapshot.size
      });
    }

    res.json({ success: true, jobsData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {
  const { id, status } = req.body;
  const companyId = req.company.uid || req.company._id;

  const allowedStatuses = ["pending", "Accepted", "Rejected"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  try {
    const appRef = db.collection("applications").doc(id);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const appData = appDoc.data();
    if (appData.companyId !== companyId) {
      return res.status(403).json({ success: false, message: "Unauthorized action: You do not own this job application" });
    }

    await appRef.update({ status });

    if (appData.userId) {
      await logActivity(appData.userId, "application_status_changed", {
        metadata: {
          applicationId: id,
          jobId: appData.jobId,
          jobTitle: appData.jobDetails?.title || "",
          companyName: appData.jobDetails?.companyName || "",
          status,
        },
      });
    }

    res.json({ success: true, message: "Status Changed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change Job Visibility
export const changeVisiblity = async (req, res) => {
  const { id } = req.body;
  const companyId = req.company.uid || req.company._id;

  try {
    const jobRef = db.collection("jobs").doc(id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.json({ success: false, message: "Job not found" });
    }

    const job = jobDoc.data();
    if (job.companyId !== companyId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    const newVisibility = !job.visible;
    await jobRef.update({ visible: newVisibility });

    res.json({ success: true, job: { _id: id, ...job, visible: newVisibility } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req, res) => {
  const companyId = req.company.uid || req.company._id;
  const { id } = req.params;

  try {
    const doc = await db.collection("applications").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const data = doc.data();
    if (data.companyId !== companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({
      success: true,
      application: {
        _id: doc.id,
        ...data,
        userId: {
          _id: data.userId,
          name: data.userDetails?.name || "Applicant",
          email: data.userDetails?.email || "",
          image: data.userDetails?.image || "",
        },
        jobId: {
          _id: data.jobId,
          title: data.jobDetails?.title || "",
          location: data.jobDetails?.location || "",
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyAnalytics = async (req, res) => {
  const companyId = req.company.uid || req.company._id;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    const [jobsSnapshot, appsSnapshot] = await Promise.all([
      db.collection("jobs").where("companyId", "==", companyId).get(),
      db.collection("applications").where("companyId", "==", companyId).get(),
    ]);

    let totalApplications = 0;
    let applicationsThisWeek = 0;
    let pendingReview = 0;
    const jobAppCounts = {};

    appsSnapshot.forEach((doc) => {
      const app = doc.data();
      totalApplications += 1;
      if ((app.date || 0) >= weekAgo) applicationsThisWeek += 1;
      const status = (app.status || "pending").toLowerCase();
      if (["pending", "applied", "review"].includes(status)) pendingReview += 1;
      if (app.jobId) {
        jobAppCounts[app.jobId] = (jobAppCounts[app.jobId] || 0) + 1;
      }
    });

    const openJobs = jobsSnapshot.docs.filter((d) => d.data().visible !== false).length;

    const topJobs = jobsSnapshot.docs
      .map((doc) => ({
        jobId: doc.id,
        title: doc.data().title || "Untitled",
        applicantCount: jobAppCounts[doc.id] || 0,
      }))
      .sort((a, b) => b.applicantCount - a.applicantCount)
      .slice(0, 10);

    res.json({
      success: true,
      metrics: {
        totalApplications,
        applicationsThisWeek,
        openJobs,
        pendingReview,
      },
      topJobs,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
