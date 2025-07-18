import { Router } from "express";
import { getProfile } from "../controllers/profileController.ts";
import { verifyToken } from "../middlewares/verifyToken.ts";

const router = Router();

router.get("/profile", verifyToken, getProfile);

export default router;
