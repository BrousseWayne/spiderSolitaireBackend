import { Router } from "express";
import { getProfile, onboarding } from "../controllers/profileController.ts";
import { verifyToken } from "../middlewares/verifyToken.ts";

const router = Router();

router.get("/profile", verifyToken, getProfile);
router.post("/onboarding", verifyToken, onboarding);

export default router;
