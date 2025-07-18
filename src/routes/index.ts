import { Router } from "express";
import authRoutes from "./auth";
import profileRoutes from "./profile";

const router = Router();

router.use(authRoutes);
router.use(profileRoutes);

export default router;
