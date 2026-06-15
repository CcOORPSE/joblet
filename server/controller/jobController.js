import { db } from "../config/firebaseAdmin.js";

// Fetch all visible recruiter-posted jobs from Firestore
export const getJobs = async (req, res) => {
  try {
    const snapshot = await db.collection("jobs").where("visible", "==", true).get();
    const jobs = [];
    snapshot.forEach((doc) => {
      jobs.push({ _id: doc.id, ...doc.data() });
    });

    jobs.sort((a, b) => (b.date || 0) - (a.date || 0));

    res.json({ success: true, jobs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobDoc = await db.collection("jobs").doc(id).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: "Job listing not found" });
    }

    const jobData = jobDoc.data();
    if (jobData.visible === false) {
      return res.status(404).json({ success: false, message: "Job listing not found" });
    }

    return res.json({
      success: true,
      job: { _id: jobDoc.id, ...jobData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
