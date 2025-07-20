import { Router } from "express";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyEmail,
  verifyToken,
} from "../controllers/authController.ts";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.get("/verify-token", verifyToken);

export default router;
