import { Router } from "express";
import {
  checkEmailVerification,
  forgotPassword,
  login,
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
router.get("/verify-token", verifyToken);
router.post("/email-verified", checkEmailVerification);
router.post("/resend-verification-email", resendVerificationEmail);

export default router;
