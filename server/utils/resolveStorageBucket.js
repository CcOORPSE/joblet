import admin from "../config/firebaseAdmin.js";

export function getStorageSetupInstructions(projectId = "YOUR_PROJECT_ID") {
  return (
    "Firebase Storage bucket not found. Enable Storage once in Firebase Console:\n" +
    `1. Open https://console.firebase.google.com/project/${projectId}/storage\n` +
    "2. Click \"Get started\" → pick a region (e.g. asia-southeast1) → Done\n" +
    "3. Copy the bucket name from the Storage page (e.g. jobfinder-de280.firebasestorage.app)\n" +
    "4. Set FIREBASE_STORAGE_BUCKET=<that-name> in server/.env\n" +
    "5. Restart the server (cd server && npm run server)\n\n" +
    "Alternative: add CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY to server/.env for logo uploads."
  );
}

/** Find the first Firebase Storage bucket that actually exists for this project. */
export async function resolveStorageBucket() {
  if (!admin.apps.length) {
    throw new Error(getStorageSetupInstructions());
  }

  const app = admin.app();
  const projectId = app.options.projectId || app.options.storageBucket?.split(".")[0];

  const candidates = [
    process.env.FIREBASE_STORAGE_BUCKET,
    app.options.storageBucket,
    projectId ? `${projectId}.firebasestorage.app` : null,
    projectId ? `${projectId}.appspot.com` : null,
  ].filter(Boolean);

  const tried = [];

  for (const name of [...new Set(candidates)]) {
    try {
      const bucket = admin.storage().bucket(name);
      const [exists] = await bucket.exists();
      tried.push(`${name}=${exists ? "ok" : "missing"}`);
      if (exists) {
        if (process.env.FIREBASE_STORAGE_BUCKET && process.env.FIREBASE_STORAGE_BUCKET !== name) {
          console.warn(
            `[Storage] Using bucket "${name}" — update FIREBASE_STORAGE_BUCKET in server/.env`
          );
        }
        return bucket;
      }
    } catch (err) {
      tried.push(`${name}=error(${err.message})`);
    }
  }

  const err = new Error(getStorageSetupInstructions(projectId || "YOUR_PROJECT_ID"));
  err.code = "STORAGE_BUCKET_NOT_FOUND";
  err.details = tried.join(", ");
  throw err;
}

/** Call once at server startup to warn early if Storage is not ready. */
export async function validateStorageBucketOnStartup() {
  if (
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_SECRET_KEY
  ) {
    console.log("Cloudinary configured — company logos will use Cloudinary.");
    return;
  }

  try {
    const bucket = await resolveStorageBucket();
    console.log(`Firebase Storage ready: ${bucket.name}`);
  } catch (error) {
    console.warn("===============================================================");
    console.warn("WARNING: Firebase Storage is not available.");
    console.warn(error.message);
    if (error.details) console.warn("Checked:", error.details);
    console.warn("Recruiter registration (logo upload) will fail until Storage is enabled.");
    console.warn("===============================================================");
  }
}
