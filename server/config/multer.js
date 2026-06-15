import multer from "multer";

const storage = multer.memoryStorage();
const buildUploader = (isAllowedMime, errorMessage) =>
  multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (isAllowedMime(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(errorMessage), false);
      }
    },
  });

export const imageUpload = buildUploader(
  (mime) => Boolean(mime?.startsWith("image/")),
  "Only image files are allowed"
);

export const pdfUpload = buildUploader(
  (mime) => mime === "application/pdf",
  "Only PDF files are allowed"
);

export default imageUpload;
