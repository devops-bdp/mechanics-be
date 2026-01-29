"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer to use memory storage
const storage = multer_1.default.memoryStorage();
// File filter to only accept images
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed"));
    }
};
// Configure multer
exports.uploadProfilePicture = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max (will be compressed to 1MB if needed)
    },
    fileFilter: fileFilter,
});
