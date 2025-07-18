import { Response } from "express";
import { pool } from "../lib/db";
import { AuthenticatedRequest } from "@/types/authenticatedRequestType";

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    req.user.email,
  ]);
  res.status(200).json({ email: result.rows[0].email });
}
