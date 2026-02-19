import Media from "../models/Media.js";

// Upload a new media
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const media = await Media.create({
      user: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Media uploaded", media });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// Get feed (all media)
export const getFeed = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).populate("user", "name email");
    res.json(media);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};

// Get user’s own media
export const getUserMedia = async (req, res) => {
  try {
    const media = await Media.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user media" });
  }
};
