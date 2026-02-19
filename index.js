// index.js — Phase 7 Production Ready with Redis

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
import redis from "./config/redis.js";
import { createAdapter } from "@socket.io/redis-adapter";

dotenv.config();
const app = express();

// Middlewares
app.use(helmet());

// ✅ Fix CORS for frontend and local dev
app.use(cors({
  origin: [
    "http://localhost:3000",                       // for local dev
    "https://vibra-kzox.onrender.com",            // your deployed frontend
  ],
  credentials: true,
}));

app.use(express.json());
app.use(compression());

// Your routes come after this
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                 // max 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);
app.use("/uploads", express.static("uploads"));

// -------------------- Basic Routes for Testing ----
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API test successful ✅" });
});

// -------------------- Health Route ----------------
app.get("/health", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "ok" : "error";
  let redisStatus = "ok";
  try {
    await redis.ping();
  } catch (err) {
    redisStatus = "error";
  }

  res.json({
    status: "ok",
    mongo: mongoStatus,
    redis: redisStatus,
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// -------------------- Routes -------------------
app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);

// -------------------- Test Protected Route ----
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

// -------------------- HTTP + Socket.IO Setup -->
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Redis adapter for Socket.IO scaling
const pubClient = redis;
const subClient = redis.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Socket.IO authentication middleware
io.use(socketAuth);

// -------------------- Socket Spam Shield ------>
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

// -------------------- Socket.IO Events -------->
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
        io.emit("mediaLiked", { mediaId, likes: media.likes });
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

// -------------------- MongoDB + Server -------->
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 9000;
    server.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
