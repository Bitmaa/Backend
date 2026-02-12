import rateLimit from "express-rate-limit";

export const mediaUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 uploads per 10 min per IP
  message: {
    error: "Upload limit reached. Please wait before uploading more media.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
