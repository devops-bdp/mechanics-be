import multer from "multer";
import { Request } from "express";

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Configure multer
export const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max (will be compressed to 1MB if needed)
  },
  fileFilter: fileFilter,
});

