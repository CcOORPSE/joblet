import admin from "firebase-admin";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let auth = null;

const resolveCredentialPath = () => {
  const cwd = process.cwd();
  const serverDir = join(__dirname, "..");
  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    join(cwd, "serviceAccountKey.json"),
    join(cwd, "server", "serviceAccountKey.json"),
    join(serverDir, "serviceAccountKey.json"),
    join(cwd, "server", "jobfinder-de280-firebase-adminsdk-fbsvc-9b2e4d657d.json"),
    join(serverDir, "jobfinder-de280-firebase-adminsdk-fbsvc-9b2e4d657d.json"),
  ].filter(Boolean);

  // Auto-detect in server directory
  try {
    const files = readdirSync(serverDir);
    const autoDetected = files.find(
      (file) => file.includes("firebase-adminsdk") && file.endsWith(".json")
    );
    if (autoDetected) {
      candidates.push(join(serverDir, autoDetected));
    }
  } catch {
    // ignore
  }

  // Auto-detect in server folder under cwd (common in Vercel monorepos)
  try {
    const serverFolder = join(cwd, "server");
    if (existsSync(serverFolder)) {
      const files = readdirSync(serverFolder);
      const autoDetected = files.find(
        (file) => file.includes("firebase-adminsdk") && file.endsWith(".json")
      );
      if (autoDetected) {
        candidates.push(join(serverFolder, autoDetected));
      }
    }
  } catch {
    // ignore
  }

  // Auto-detect in cwd
  try {
    const files = readdirSync(cwd);
    const autoDetected = files.find(
      (file) => file.includes("firebase-adminsdk") && file.endsWith(".json")
    );
    if (autoDetected) {
      candidates.push(join(cwd, autoDetected));
    }
  } catch {
    // ignore
  }

  for (const credentialPath of candidates) {
    if (credentialPath && existsSync(credentialPath)) {
      return credentialPath;
    }
  }

  return null;
};

let firebaseInitError = null;

try {
  let serviceAccount = null;
  let credentialSource = "Unknown";

  // Strategy 1: Full JSON blob in FIREBASE_SERVICE_ACCOUNT_JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      let jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
      // Remove any surrounding single or double quotes that dashboards sometimes add
      if ((jsonStr.startsWith("'") && jsonStr.endsWith("'")) ||
          (jsonStr.startsWith('"') && jsonStr.endsWith('"'))) {
        jsonStr = jsonStr.slice(1, -1);
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.private_key) {
        // Fix escaped newlines (\\n -> actual \n) that some env editors produce
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      serviceAccount = parsed;
      credentialSource = "FIREBASE_SERVICE_ACCOUNT_JSON env var";
      console.log("Firebase: loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON");
    } catch (parseErr) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseErr.message);
    }
  }

  // Strategy 2: Individual env vars (most reliable on Vercel)
  if (!serviceAccount &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Remove outer quotes (single or double) that Vercel sometimes adds
    if ((privateKey.startsWith("'") && privateKey.endsWith("'")) ||
        (privateKey.startsWith('"') && privateKey.endsWith('"'))) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Support multiple newline format encodings:
    // 1. \\\\n (double-escaped from some sources)
    // 2. \\n (standard Vercel format)
    // 3. \n (already processed)
    // 4. Literal newlines (already correct)
    privateKey = privateKey.replace(/\\\\n/g, "\n");  // \\\\n → \n (double escape)
    privateKey = privateKey.replace(/\\n/g, "\n");    // \\n → \n (single escape)
    privateKey = privateKey.replace(/NEWLINE/gi, "\n"); // NEWLINE token fallback
    
    // Validate the key actually contains PEM markers
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY: Invalid format - missing 'BEGIN PRIVATE KEY' marker. " +
        "Ensure you copied the entire private_key value from the Firebase service account JSON."
      );
    }
    
    if (!privateKey.includes("END PRIVATE KEY")) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY: Invalid format - missing 'END PRIVATE KEY' marker. " +
        "Ensure you copied the entire private_key value including the END marker."
      );
    }

    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: privateKey,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    };
    credentialSource = "Individual FIREBASE_* env vars";
    console.log("Firebase: loaded credentials from individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
  }

  // Strategy 3: Fallback to local JSON file (dev only)
  if (!serviceAccount) {
    const credentialPath = resolveCredentialPath();
    if (credentialPath) {
      serviceAccount = JSON.parse(readFileSync(credentialPath, "utf8"));
      credentialSource = credentialPath;
      console.log(`Firebase: loaded credentials from file: ${credentialPath}`);
    } else {
      throw new Error(
        "Firebase credentials not found. Set either:\n" +
        "  1. FIREBASE_SERVICE_ACCOUNT_JSON = <full JSON string>\n" +
        "  2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY\n" +
        "  3. Place serviceAccountKey.json or *firebase-adminsdk*.json in the server directory."
      );
    }
  }

  // Use storage bucket from env or build it from project id
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    (serviceAccount && serviceAccount.project_id ? `${serviceAccount.project_id}.firebasestorage.app` : "");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket,
  });

  db = admin.firestore();
  auth = admin.auth();
  console.log(`✅ Firebase Admin SDK initialized (${credentialSource})`);
  console.log(`✅ Firebase Storage bucket: ${storageBucket}`);
  console.log(`✅ Firebase Auth configured and ready`);
  console.log(`✅ All critical services initialized - API endpoints are LIVE`);
} catch (error) {
  firebaseInitError = error.message;
  console.error("================================================================");
  console.error("⚠️  FIREBASE INIT FAILED — API calls will return 500 errors");
  console.error("Details:", error.message);
  console.error("================================================================");
  // Do NOT throw — keeps Express alive so /api/debug-firebase-init is reachable
}

export { db, auth, firebaseInitError };
export default admin;
