import express from "express";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Get feed
router.get("/", authMiddleware, async (req, res) => {
  // Example: fetch from DB, sort newest first
  const feed = [
    // Sample objects
    { type: "image", url: "/uploads/sample1.jpg", caption: "Nice pic" },
    { type: "video", url: "/uploads/sample2.mp4", caption: "My video" },
    { type: "audio", url: "/uploads/sample3.mp3", caption: "Audio clip" },
  ];
  res.json(feed);
});

export default router;
