import { db } from "../config/firebaseAdmin.js";

const toIso = (val) => {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  if (typeof val === "number") return new Date(val).toISOString();
  return String(val);
};

export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const snapshot = await db.collection("activity_logs").where("userId", "==", userId).get();

    const activities = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          title: data.title,
          metadata: data.metadata || {},
          timestamp: toIso(data.timestamp),
          _sort: data.timestamp?.toMillis?.() || data.timestamp || 0,
        };
      })
      .sort((a, b) => b._sort - a._sort)
      .slice(0, limit)
      .map(({ _sort, ...rest }) => rest);

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
