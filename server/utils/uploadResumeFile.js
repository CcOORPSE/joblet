import { v2 as cloudinary } from "cloudinary";
import { supabase } from "../config/supabase.js";
import admin from "../config/firebaseAdmin.js";

const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_SECRET_KEY
  );

const isSupabaseConfigured = () => Boolean(supabase);

/** Resolve a fresh signed URL from a storage path or pass through HTTPS URLs. */
export async function getSignedResumeUrl(storagePath) {
  if (!storagePath) return null;
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  // Supabase Storage path - try both 'resume' and 'resumes' bucket names
  if (isSupabaseConfigured()) {
    // Try 'resume' first (singular)
    let result = await supabase.storage
      .from('resume')
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    
    if (result.error) {
      // Try 'resumes' (plural) as fallback
      result = await supabase.storage
        .from('resumes')
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    }
    
    if (result.error) {
      console.error('Error creating signed URL:', result.error.message);
      return null;
    }
    return result.data.signedUrl;
  }

  // Firebase Storage path fallback
  try {
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(storagePath);
    const [exists] = await fileRef.exists();
    if (exists) {
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
      });
      return url;
    }
  } catch (firebaseErr) {
    console.error('[getSignedResumeUrl] Firebase storage signed URL generation failed:', firebaseErr.message);
  }

  return null;
}

/** Upload to Firebase Storage via Admin SDK. */
async function uploadToFirebaseStorage(file) {
  const bucket = admin.storage().bucket();
  const safeName = (file.originalname || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const destination = `resumes/${Date.now()}-${safeName}`;

  const fileRef = bucket.file(destination);
  await fileRef.save(file.buffer, {
    metadata: { contentType: file.mimetype || "application/pdf" },
    resumable: false,
  });

  return { storagePath: destination };
}

/**
 * Upload a resume file. Returns a short-lived signed URL and a stable storagePath
 * (Cloudinary HTTPS URL for Cloudinary uploads, Supabase path for Supabase Storage).
 */
export async function uploadResumeFile(file) {
  if (!file?.buffer) {
    throw new Error("No resume file received");
  }

  // 1. Try Cloudinary first
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });

    const dataUri = `data:${file.mimetype || "application/pdf"};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "resumes",
      resource_type: "auto",
    });
    return { url: result.secure_url, storagePath: result.secure_url };
  }

  // 2. Try Firebase Storage (highly recommended for serverless/Vercel)
  try {
    const { storagePath } = await uploadToFirebaseStorage(file);
    const url = await getSignedResumeUrl(storagePath);
    console.log("[uploadResumeFile] Uploaded via Firebase Storage:", url);
    return { url, storagePath };
  } catch (firebaseErr) {
    console.warn("[uploadResumeFile] Firebase Storage failed:", firebaseErr.message);
  }

  // 3. Try Supabase Storage
  if (isSupabaseConfigured()) {
    try {
      const safeName = (file.originalname || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${Date.now()}-${safeName}`;

      let result = await supabase.storage
        .from('resume')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || "application/pdf",
          upsert: false
        });

      // If 'resume' bucket doesn't exist, try 'resumes'
      if (result.error && result.error.message.includes('not found')) {
        result = await supabase.storage
          .from('resumes')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || "application/pdf",
            upsert: false
          });
      }

      if (!result.error) {
        const url = await getSignedResumeUrl(result.data.path);
        return { url, storagePath: result.data.path };
      }
      
      console.warn("[uploadResumeFile] Supabase Storage error:", result.error.message);
    } catch (supabaseErr) {
      console.warn("[uploadResumeFile] Supabase Storage failed:", supabaseErr.message);
    }
  }

  // 4. Local Disk Fallback (guaranteed to work locally)
  try {
    const fs = await import("fs");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "uploads", "resumes");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeName = (file.originalname || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const localUrl = `${backendUrl}/uploads/resumes/${filename}`;
    console.log("[uploadResumeFile] Fallback to Local Storage successful:", localUrl);
    return { url: localUrl, storagePath: localUrl };
  } catch (localErr) {
    console.error("[uploadResumeFile] Local fallback failed:", localErr.message);
  }

  throw new Error(
    "Resume upload is not configured, and local fallback failed."
  );
}
