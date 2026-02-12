import express from "express";
import { protect } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import { getAllUsers, deleteUser, getStats } from "../controllers/adminController.js";
import { adminLimiter } from "../middleware/security.js";

const router = express.Router();

router.use(adminLimiter, protect, admin);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/stats", getStats);

export default router;
