import express from "express";
import { register, login } from "../controllers/authController.js";
import { loginLimiter, signupLimiter } from "../middleware/security.js";

const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/register", signupLimiter, register);

export default router;
