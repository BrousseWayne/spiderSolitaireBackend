import { Router } from "express";
import {
  editProfile,
  getProfile,
  onboarding,
} from "../controllers/profileController.ts";
import { verifyToken } from "../middlewares/verifyToken.ts";

const router = Router();

router.get("/profile", verifyToken, getProfile);
router.post("/onboarding", verifyToken, onboarding);
router.put("/profile", verifyToken, editProfile);

export default router;
