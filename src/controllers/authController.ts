import { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../lib/db.ts";
import { JWT_SECRET, SALT_ROUNDS } from "../lib/conf.ts";
import sendPasswordRecoveryMail from "../sendMail.ts";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const expiresIn = 2 * 60 * 60;
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "dev",
      sameSite: "lax",
      maxAge: expiresIn * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length > 0) {
    res.status(409).json({ error: "Email already used" });
    return;
  }

  const hashedPass = await bcrypt.hash(password, SALT_ROUNDS);
  const values = [email, hashedPass];
  const text = "INSERT INTO users(email, password) VALUES($1, $2) RETURNING *";

  const insertedUser = await pool.query(text, values);
  res.status(201).json({
    message: "User registered",
    user: insertedUser.rows[0].email,
  });
}

export function verifyToken(req: Request, res: Response) {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Token missing" });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    res.sendStatus(200);
    return;
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "20M" }
      );

      await sendPasswordRecoveryMail(email, token);
    }

    res.status(200).json({
      message:
        "If your email is registered, you will receive a recovery link shortly.",
    });
    return;
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "Missing token or password" });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as {
      email: string;
      userId: number;
    };
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    decoded.email,
  ]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const hashedPass = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
    hashedPass,
    decoded.email,
  ]);

  res.status(200).json({ message: "Password updated" });
}
