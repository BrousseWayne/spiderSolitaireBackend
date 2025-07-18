import { type Response, type Request } from "express";
import { pool } from "../lib/db.ts";
import { type AuthenticatedRequest } from "../types/authenticatedRequestType.ts";

export async function getProfile(req: Request, res: Response) {
  const { user } = req as AuthenticatedRequest;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    user.email,
  ]);
  res.status(200).json({ email: result.rows[0].email });
}
