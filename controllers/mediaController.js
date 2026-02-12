import Media from "../models/Media.js";

// UPLOAD MEDIA
export const uploadMedia = async (req, res) => {
  try {
    const media = await Media.create({
      user: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json(media);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// GET ALL MEDIA
export const getFeed = async (req, res) => {
  try {
    const feed = await Media.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load feed" });
  }
};

// GET USER MEDIA
export const getUserMedia = async (req, res) => {
  try {
    const media = await Media.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(media);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load user media" });
  }
};
