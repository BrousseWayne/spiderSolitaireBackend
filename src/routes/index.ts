import { Router } from "express";
import authRoutes from "./auth.ts";
import profileRoutes from "./profile.ts";

const router = Router();

router.use(authRoutes);
router.use(profileRoutes);

export default router;
