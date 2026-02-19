import rateLimit from "express-rate-limit";

// Signup rate limiter
export const signupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many signup attempts. Try again later.",
});

// Media upload rate limiter
export const mediaUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many uploads. Try again later.",
});

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later.",
});
