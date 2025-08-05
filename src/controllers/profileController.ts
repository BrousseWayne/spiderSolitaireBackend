import { type Response, type Request } from "express";
import { pool } from "../lib/db.ts";
import { type AuthenticatedRequest } from "../types/authenticatedRequestType.ts";

export async function getProfile(req: Request, res: Response) {
  const { user } = req as AuthenticatedRequest;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    user.email,
  ]);

  const { password, id, ...userWithoutPass } = result.rows[0];

  const result2 = await pool.query("SELECT * FROM stats WHERE user_id = $1", [
    id,
  ]);

  if (result2.rows.length > 0) {
    console.log(result2.rows[0], userWithoutPass);
    const merged = { ...userWithoutPass, ...result2.rows[0] };
    res.status(200).json({ user: merged });
    return;
  }
  res.status(200).json({ user: userWithoutPass });
}

export async function editProfile(req: Request, res: Response) {
  const { nickname, default_game_mode, profile_picture } = req.body;
  const { user } = req as AuthenticatedRequest;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      user.email,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const text = `
      UPDATE stats
      SET nickname = $1,
          default_game_mode = $2,
          profile_picture = $3
          has_default_mode = $4
      WHERE user_id = $5
      RETURNING *
    `;

    const updateResult = await pool.query(text, [
      nickname,
      default_game_mode,
      profile_picture,
      !!default_game_mode,
      user.userId,
    ]);

    res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function onboarding(req: Request, res: Response) {
  const { nickname, default_game_mode, profile_picture } = req.body;
  const { user } = req as AuthenticatedRequest;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    user.email,
  ]);

  if (result.rows[0].hascompletedonboarding === true) {
    res.status(200).json({ message: "completed" });
    return;
  }

  const text =
    "INSERT INTO stats(nickname, user_id, default_game_mode, profile_picture, has_default_mode) VALUES($1, $2, $3, $4, $5) RETURNING *";
  await pool.query(text, [
    nickname,
    user.userId,
    default_game_mode,
    profile_picture,
    !!default_game_mode,
  ]);

  await pool.query(
    "UPDATE users SET hascompletedonboarding = $1 WHERE email = $2",
    [true, user.email]
  );

  console.log(nickname, default_game_mode, profile_picture);
  res.status(200);
}

//TODO: rename db entities stats -> profile
