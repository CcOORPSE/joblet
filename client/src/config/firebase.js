import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const trim = (value) => (typeof value === "string" ? value.trim() : "");

const firebaseConfig = {
  apiKey: trim(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: trim(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: trim(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: trim(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trim(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: trim(import.meta.env.VITE_FIREBASE_APP_ID),
};

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingKeys = requiredEnvKeys.filter((key) => !trim(import.meta.env[key]));

export let auth = null;
export let googleProvider = null;
export let db = null;
export let firebaseInitError = null;

if (missingKeys.length > 0) {
  firebaseInitError =
    `Missing Firebase environment variables: ${missingKeys.join(", ")}. ` +
    "Copy client/.env.example to client/.env, fill in values from Firebase Console, then restart the dev server (npm run dev).";
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (error) {
    firebaseInitError =
      error?.message ||
      "Firebase failed to initialize. Verify your API key in Firebase Console and restart the dev server.";
    console.error("Firebase initialization error:", error);
  }
}

export const isFirebaseReady = Boolean(auth && googleProvider && db);
