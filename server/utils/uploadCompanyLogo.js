import { v2 as cloudinary } from "cloudinary";
import { supabase } from "../config/supabase.js";
import admin from "../config/firebaseAdmin.js";

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_SECRET_KEY
  );

const isSupabaseConfigured = () => Boolean(supabase);

/** Upload to Firebase Storage via Admin SDK and return a public URL. */
async function uploadToFirebaseStorage(file) {
  const bucket = admin.storage().bucket(); // uses storageBucket from admin.initializeApp
  const safeName = (file.originalname || "logo.png").replace(/[^a-zA-Z0-9._-]/g, "_");
  const destination = `company-logos/${Date.now()}-${safeName}`;

  const fileRef = bucket.file(destination);
  await fileRef.save(file.buffer, {
    metadata: { contentType: file.mimetype || "image/png" },
    resumable: false,
  });

  // Make the file publicly readable
  await fileRef.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

/** Upload recruiter company logo. Priority: Cloudinary -> Firebase Storage -> Supabase */
export async function uploadCompanyLogo(file) {
  if (!file?.buffer) {
    throw new Error("No image file received");
  }

  // 1. Cloudinary
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      { folder: "company-logos" }
    );
    return result.secure_url;
  }

  // 2. Firebase Storage (Admin SDK — uses FIREBASE_STORAGE_BUCKET already in .env)
  try {
    const url = await uploadToFirebaseStorage(file);
    console.log("[uploadCompanyLogo] Uploaded via Firebase Storage:", url);
    return url;
  } catch (firebaseErr) {
    console.warn("[uploadCompanyLogo] Firebase Storage failed:", firebaseErr.message);
    // Fall through to Supabase
  }

  // 3. Supabase Storage (last resort)
  if (isSupabaseConfigured()) {
    const safeName = (file.originalname || "logo.png").replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${Date.now()}-${safeName}`;

    const bucketCandidates = ["logos", "logo", "company-logos", "company_logos", "images"];
    let successResult = null;
    let successBucket = null;

    for (const bucketName of bucketCandidates) {
      try {
        const result = await supabase.storage
          .from(bucketName)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || "image/png",
            upsert: false,
          });

        if (!result.error) {
          successResult = result;
          successBucket = bucketName;
          break;
        }

        const isBucketMissing =
          result.error.message?.toLowerCase().includes("not found") ||
          result.error.message?.toLowerCase().includes("does not exist") ||
          result.error.statusCode === 404 ||
          result.error.error === "Bucket not found";

        if (!isBucketMissing) {
          console.warn(
            `[uploadCompanyLogo] Supabase bucket "${bucketName}" error:`,
            result.error.message
          );
        }
      } catch (fetchErr) {
        // Network-level failure (Supabase Storage not reachable) — try next bucket name
        console.warn(
          `[uploadCompanyLogo] Supabase network error for bucket "${bucketName}":`,
          fetchErr.message
        );
      }
    }

    if (successResult) {
      const { data: publicUrlData } = supabase.storage
        .from(successBucket)
        .getPublicUrl(successResult.data.path);
      return publicUrlData.publicUrl;
    }
  }

  // 4. Local Disk Fallback (guaranteed to work locally)
  try {
    const fs = await import("fs");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "uploads", "company-logos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeName = (file.originalname || "logo.png").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const localUrl = `${backendUrl}/uploads/company-logos/${filename}`;
    console.log("[uploadCompanyLogo] Fallback to Local Storage successful:", localUrl);
    return localUrl;
  } catch (localErr) {
    console.error("[uploadCompanyLogo] Local fallback failed:", localErr.message);
  }

  throw new Error(
    "Logo upload failed: no storage provider is available and local fallback failed.\n" +
      "Options:\n" +
      "  A) Add CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY to server/.env\n" +
      "  B) Enable Firebase Storage in the Firebase Console — set FIREBASE_STORAGE_BUCKET in server/.env\n" +
      "  C) Create a public 'logos' bucket in Supabase (Storage -> New bucket -> Public: ON)"
  );
}
