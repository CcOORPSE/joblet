import { auth, db, firebaseInitError } from '../config/firebaseAdmin.js';

// Unified Firebase Auth ID Token Verifier and Role Guard
export const protectRoute = (requiredRole) => async (req, res, next) => {
  try {
    if (!auth || !db) {
      console.error("[Auth Middleware] Firebase not initialized", {
        authExists: !!auth,
        dbExists: !!db,
        firebaseInitError
      });
      
      return res.status(503).json({
        success: false,
        message: "Firebase Admin SDK is not initialized. Please verify environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET.",
        details: firebaseInitError || "Unknown initialization error"
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Privileged roles must come from Firebase custom claims only (not client-writable Firestore)
    const claimRole = decodedToken.role;
    let role = claimRole;

    if (!role && requiredRole !== "admin") {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        role = userDoc.data().role;
      }
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: role || "user",
      name: decodedToken.name || ""
    };

    if (requiredRole === "admin") {
      if (claimRole !== "admin") {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
      }
    } else if (requiredRole === "user") {
      // Both applicant role ('user') and recruiter role ('recruiter') are allowed to access basic user/applicant paths
      if (req.user.role !== "user" && req.user.role !== "recruiter") {
        return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
      }
    } else if (requiredRole && req.user.role !== requiredRole) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

// Deprecated company token backward compatibility wrapper
export const protectCompany = async (req, res, next) => {
  try {
    if (!auth || !db) {
      console.error("[Auth Middleware] Firebase not initialized for company route", {
        authExists: !!auth,
        dbExists: !!db,
        firebaseInitError
      });
      
      return res.status(503).json({
        success: false,
        message: "Firebase Admin SDK is not initialized. Please verify environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET.",
        details: firebaseInitError || "Unknown initialization error"
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    let role = decodedToken.role;
    if (!role) {
      const companyDoc = await db.collection("companies").doc(decodedToken.uid).get();
      if (companyDoc.exists) {
        role = companyDoc.data().role;
      }
    }

    if (role !== "recruiter") {
      return res.status(403).json({ success: false, message: "Forbidden: Recruiter access required" });
    }

    // Convert Firebase data to mimic the old custom JWT req.company shape
    req.company = {
      _id: decodedToken.uid,
      uid: decodedToken.uid,
      name: decodedToken.name || "Recruiter",
      email: decodedToken.email,
      role: decodedToken.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, Login Again" });
  }
};
