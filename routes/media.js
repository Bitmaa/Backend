import express from "express";
import { uploadMedia, getFeed, getUserMedia } from "../controllers/mediaController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { mediaUploadLimiter } from "../middleware/mediaLimiter.js";

const router = express.Router();

router.post("/", protect, mediaUploadLimiter, uploadMedia);
router.get("/", protect, getFeed);
router.get("/me", protect, getUserMedia);

export default router;
