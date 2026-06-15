import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = async () => {
  const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY } = process.env;

  if (!CLOUDINARY_API_KEY || !CLOUDINARY_NAME || !CLOUDINARY_SECRET_KEY) {
    console.log(
      "Cloudinary not configured — company logos will use Firebase Storage when available."
    );
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_SECRET_KEY,
  });
};

export default connectCloudinary;