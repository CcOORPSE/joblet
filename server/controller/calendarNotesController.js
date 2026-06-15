import { db } from "../config/firebaseAdmin.js";

// Fetch notes and reminders for a specific jobId
export const getNotesAndReminders = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.uid || req.company?.uid || req.company?._id;
  const role = req.user ? "user" : "recruiter";

  if (!jobId) {
    return res.status(400).json({ success: false, message: "jobId is required" });
  }

  try {
    const snapshot = await db.collection("job_notes_reminders")
      .where("jobId", "==", jobId)
      .where("userId", "==", userId)
      .where("role", "==", role)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        data: {
          jobId,
          userId,
          role,
          notes: "",
          reminderDate: "",
          reminderTitle: "",
          reminderSynced: false
        }
      });
    }

    const doc = snapshot.docs[0];
    res.json({ success: true, data: { _id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save or Update notes and reminders for a specific jobId
export const saveNotesAndReminders = async (req, res) => {
  const { jobId, notes, reminderDate, reminderTitle, reminderSynced } = req.body;
  const userId = req.user?.uid || req.company?.uid || req.company?._id;
  const role = req.user ? "user" : "recruiter";

  if (!jobId) {
    return res.status(400).json({ success: false, message: "jobId is required" });
  }

  try {
    const snapshot = await db.collection("job_notes_reminders")
      .where("jobId", "==", jobId)
      .where("userId", "==", userId)
      .where("role", "==", role)
      .get();

    const dataPayload = {
      jobId,
      userId,
      role,
      notes: notes || "",
      reminderDate: reminderDate || "",
      reminderTitle: reminderTitle || "",
      reminderSynced: !!reminderSynced,
      updatedAt: Date.now()
    };

    if (snapshot.empty) {
      dataPayload.createdAt = Date.now();
      await db.collection("job_notes_reminders").add(dataPayload);
    } else {
      const docRef = snapshot.docs[0].ref;
      await docRef.update(dataPayload);
    }

    res.json({ success: true, message: "Notes and reminders saved successfully!", data: dataPayload });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Google Calendar sync state
export const toggleGoogleCalendar = async (req, res) => {
  const userId = req.user?.uid || req.company?.uid || req.company?._id;
  const isRecruiter = !req.user;
  const { connected, email } = req.body;

  try {
    const collectionName = isRecruiter ? "companies" : "users";
    const docRef = db.collection(collectionName).doc(userId);

    await docRef.update({
      calendarConnected: !!connected,
      calendarEmail: connected ? (email || "user@gmail.com") : ""
    });

    res.json({
      success: true,
      message: connected ? "Google Calendar connected successfully!" : "Google Calendar disconnected.",
      connected: !!connected,
      calendarEmail: connected ? (email || "user@gmail.com") : ""
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch google calendar events, merged with simulated system events and active reminders
export const getCalendarEvents = async (req, res) => {
  const userId = req.user?.uid || req.company?.uid || req.company?._id;
  const role = req.user ? "user" : "recruiter";

  try {
    // Get active reminders
    const remindersSnapshot = await db.collection("job_notes_reminders")
      .where("userId", "==", userId)
      .where("role", "==", role)
      .where("reminderSynced", "==", true)
      .get();

    const events = [];

    // Parse active reminders into calendar events
    remindersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.reminderDate) {
        events.push({
          id: doc.id,
          title: data.reminderTitle || "Job Reminder",
          date: data.reminderDate,
          description: data.notes || "No notes details",
          isReminder: true
        });
      }
    });

    // Add some realistic simulated platform events depending on user / recruiter
    const today = new Date();
    if (role === "user") {
      events.push({
        id: "sim-1",
        title: "Mock Interview with Google Core Team",
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        description: "Focus on System Design & Data Structures.",
        isReminder: false
      });
      events.push({
        id: "sim-2",
        title: "Joblet.ai Resume Review Session",
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Live resume feedback with automated ATS report.",
        isReminder: false
      });
    } else {
      events.push({
        id: "sim-r1",
        title: "Panel Interview: Senior Frontend Engineer",
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        description: "Candidate: Jane Doe. Focus on React & CSS performance.",
        isReminder: false
      });
      events.push({
        id: "sim-r2",
        title: "Weekly HR Pipeline Sync",
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Review top job applicants and approve offers.",
        isReminder: false
      });
    }

    // Sort events by date ascending
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
