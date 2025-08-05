import { type Response, type Request } from "express";
import { pool } from "../lib/db.ts";
import { type AuthenticatedRequest } from "../types/authenticatedRequestType.ts";

export async function getProfile(req: Request, res: Response) {
  const { user } = req as AuthenticatedRequest;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    user.email,
  ]);

  const { password, id, ...userWithoutPass } = result.rows[0];
  res.status(200).json({ user: userWithoutPass });
}

export async function onboarding(req: Request, res: Response) {
  const { nickname, default_game_mode, profile_picture } = req.body;
  const { user } = req as AuthenticatedRequest;

  const text =
    "INSERT INTO stats(nickname, user_id, default_game_mode, profile_picture) VALUES($1, $2, $3, $4) RETURNING *";
  await pool.query(text, [
    nickname,
    user.userId,
    default_game_mode,
    profile_picture,
  ]);

  await pool.query(
    "UPDATE users SET hascompletedonboarding = $1 WHERE email = $2",
    [true, user.email]
  );

  console.log(nickname, default_game_mode, profile_picture);
}
