import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Lazy initialization - only configure when needed
let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) return;

  const cloudinaryName = process.env.CLOUDINARY_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudinaryName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    throw new Error(
      "Missing Cloudinary environment variables. Please set CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables."
    );
  }

  cloudinary.config({
    cloud_name: cloudinaryName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
  });

  isConfigured = true;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes
const FOLDER_NAME = "mar_user_profile_picture";

/**
 * Convert buffer to stream
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Upload image to Cloudinary with compression if needed
 */
export async function uploadProfilePicture(
  fileBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  try {
    // Ensure Cloudinary is configured
    ensureCloudinaryConfigured();

    // Check file size
    const fileSize = fileBuffer.length;

    // If file is larger than 1MB, compress it
    const uploadOptions: any = {
      folder: FOLDER_NAME,
      public_id: `${userId}_${Date.now()}`,
      resource_type: "image",
      overwrite: false,
      format: "jpg", // Convert to JPG for better compression
    };

    // If file is larger than 1MB, add compression
    if (fileSize > MAX_FILE_SIZE) {
      uploadOptions.quality = "auto:low"; // Auto quality with low setting for compression
    } else {
      uploadOptions.quality = "auto"; // Auto quality for files under 1MB
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error("Failed to upload image to Cloudinary"));
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error("No result from Cloudinary upload"));
          }
        }
      );

      bufferToStream(fileBuffer).pipe(uploadStream);
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    throw new Error("Failed to upload profile picture");
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteProfilePicture(imageUrl: string): Promise<void> {
  try {
    // Ensure Cloudinary is configured
    ensureCloudinaryConfigured();

    // Extract public_id from URL using the helper function
    const publicId = extractPublicIdFromUrl(imageUrl);

    if (!publicId) {
      console.warn("Could not extract public_id from URL:", imageUrl);
      return;
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      console.warn("Failed to delete image from Cloudinary:", result);
    }
  } catch (error) {
    console.error("Delete profile picture error:", error);
    // Don't throw error, just log it - we don't want to fail the update if delete fails
  }
}

/**
 * Extract public_id from Cloudinary URL for deletion
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
    // or: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?([^/]+\/[^.]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
}
