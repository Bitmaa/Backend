import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

import authRoutes from "./routes/auth.js";
import mediaRoutes from "./routes/media.js";
import adminRoutes from "./routes/admin.js";

import { protect } from "./middleware/auth.js";
import { socketAuth } from "./middleware/socketAuth.js";
import Media from "./models/Media.js";

dotenv.config();
const app = express();
app.set('trust proxy', 1);

// -------------------- Middlewares --------------------
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://vibra-frontend-g7oo.onrender.com",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(compression());

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                 // max 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);
app.use("/uploads", express.static("uploads"));

// -------------------- Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API test successful ✅" });
});

// Health check route
app.get("/health", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  res.json({
    status: "ok",
    mongo: mongoStatus,
    redis: "skipped",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Protected test route
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

// -------------------- HTTP + Socket.IO --------------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Socket.IO authentication middleware
io.use(socketAuth);

// Socket spam limiter
const socketRateMap = new Map();
const socketLimiter = (socket, limit = 15, windowMs = 60000) => {
  const key = socket.user.id;
  const now = Date.now();
  if (!socketRateMap.has(key)) socketRateMap.set(key, []);
  const timestamps = socketRateMap.get(key).filter(ts => now - ts < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  socketRateMap.set(key, timestamps);
  return true;
};

// Socket.IO events
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.user.id);

  // Upload media
  socket.on("newMedia", async (data) => {
    if (!socketLimiter(socket)) return socket.emit("error", "Rate limit exceeded");

    try {
      const saved = await Media.create({
        user: socket.user.id,
        url: data.url,
        type: data.type,
        caption: data.caption || "",
        likes: [],
        comments: [],
      });
      console.log("📸 Media saved:", saved._id);
      io.emit("mediaUpdate", saved);
    } catch (err) {
      console.error("❌ Upload error:", err.message);
    }
  });

  // Like media
  socket.on("likeMedia", async ({ mediaId }) => {
    if (!socketLimiter(socket)) return socket.emit("error", "Rate limit exceeded");

    try {
      const media = await Media.findById(mediaId);
      if (!media.likes.includes(socket.user.id)) {
        media.likes.push(socket.user.id);
        await media.save();
        io.emit("mediaLiked", { mediaId, likes: media.likes.length });
      }
    } catch (err) {
      console.error("❌ Like error:", err.message);
    }
  });

  // Comment media
  socket.on("commentMedia", async ({ mediaId, text }) => {
    if (!socketLimiter(socket)) return socket.emit("error", "Rate limit exceeded");

    try {
      const media = await Media.findById(mediaId);
      const comment = { user: socket.user.id, text };
      media.comments.push(comment);
      await media.save();
      io.emit("mediaCommented", { mediaId, comments: media.comments });
    } catch (err) {
      console.error("❌ Comment error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.user.id);
  });
});

// -------------------- MongoDB + Server --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 9000;
    server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
