import User from "../models/User.js";
import Media from "../models/Media.js";

// List all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// Dashboard stats
export const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const mediaCount = await Media.countDocuments();
    res.json({ userCount, mediaCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
