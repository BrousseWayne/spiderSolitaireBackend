import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "@/lib/db";
import { JWT_SECRET, SALT_ROUNDS } from "@/lib/conf";

export async function login(req: Request, res: Response) {
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

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "2h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
  });

  res.json({ message: "Login successful" });
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
    res.sendStatus(401);
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    res.sendStatus(200);
  } catch {
    res.sendStatus(401);
  }
}
