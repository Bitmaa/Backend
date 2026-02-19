import express from "express";
import { uploadMedia, getFeed, getUserMedia } from "../controllers/mediaController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { mediaUploadLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Upload media
router.post(
  "/",
  protect,
  mediaUploadLimiter,
  upload.single("file"),
  uploadMedia
);

// Feed
router.get("/", protect, getFeed);

// My uploads
router.get("/me", protect, getUserMedia);

export default router;
