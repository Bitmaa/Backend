import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts only
  message: {
    error: "Too many login attempts. Try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 accounts per hour per IP
  message: {
    error: "Too many signup attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
