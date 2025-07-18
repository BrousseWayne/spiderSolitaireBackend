import { Router } from "express";
import { getProfile } from "@/controllers/profileController";
import { verifyToken } from "@/middlewares/verifyToken";

const router = Router();

router.get("/profile", verifyToken, getProfile);

export default router;
