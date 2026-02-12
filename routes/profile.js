import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Get current user profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
