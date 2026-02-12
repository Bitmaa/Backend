const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/authMiddleware');
const Post = require('../models/Post');

// Image upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const post = new Post({
      user: req.user.id,
      text: req.body.text,
      image: req.file?.path
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().populate('user', 'username').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Like a post
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.user.id)) post.likes.push(req.user.id);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

