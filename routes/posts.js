import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import Post from "../models/Post.js";

const router = express.Router();

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Create a post
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const post = new Post({
      user: req.user._id,
      text: req.body.text,
      image: req.file?.path,
    });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all posts
router.get("/", protect, async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name email");
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Like a post
router.put("/like/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
