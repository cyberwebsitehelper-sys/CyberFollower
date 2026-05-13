import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File, folder = "noc") {
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "auto",
  });
  return {
    url: result.secure_url,
    public_id: result.public_id,
    original_filename: result.original_filename,
  };
}

