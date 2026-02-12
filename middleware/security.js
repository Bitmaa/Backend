import rateLimit from "express-rate-limit";

// 🔐 Login brute-force limiter
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { error: "Too many login attempts. Try again later." }
});

// 🚦 Signup abuse limiter
export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many signup attempts. Slow down." }
});

// 🧱 Admin firewall limiter
export const adminLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 50,
  message: { error: "Admin rate limit exceeded." }
});
