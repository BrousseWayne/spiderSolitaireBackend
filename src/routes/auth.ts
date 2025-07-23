import { Router } from "express";
import {
  checkEmailVerification,
  forgotPassword,
  login,
  logout,
  register,
  resendVerificationEmail,
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
router.post("/email-verified", checkEmailVerification);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/logout", logout);
router.get("/verify-token", verifyToken);

export default router;
