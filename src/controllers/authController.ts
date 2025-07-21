import { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool, selectUsersByEmail } from "../lib/db.ts";
import { JWT_SECRET, SALT_ROUNDS } from "../lib/conf.ts";
import sendPasswordRecoveryMail from "../sendMail.ts";
import sendPasswordVerificationMail from "../sendMail.ts";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await pool.query(selectUsersByEmail, [email]);

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

    if (user.verified !== true) {
      res.status(600).json({ message: "Email not verified" });
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
  const result = await pool.query(selectUsersByEmail, [email]);

  if (result.rows.length > 0) {
    res.status(409).json({ error: "Email already used" });
    return;
  }

  const hashedPass = await bcrypt.hash(password, SALT_ROUNDS);
  const values = [email, hashedPass];
  const text = "INSERT INTO users(email, password) VALUES($1, $2) RETURNING *";
  const insertedUser = await pool.query(text, values);

  const token = jwt.sign({ email: email }, JWT_SECRET, {
    expiresIn: "20M",
  });

  try {
    // await sendPasswordVerificationMail(email, token);
    await pool.query(
      "UPDATE users SET last_attempted_verification = $1 WHERE email = $2",
      [new Date(), email]
    );

    //TODO: verif timer since last verif email
  } catch (err) {
    console.error(err);
  }

  res.status(201).json({
    message: "User registered",
    user: insertedUser.rows[0].email,
  });
}

export async function resendVerificationEmail(req: Request, res: Response) {
  const { email } = req.body;
  const result = await pool.query(selectUsersByEmail, [email]);

  if (result.rows.length === 0) {
    res.status(401).json({ error: "Invalid request" });
    return;
  }

  const user = result.rows[0];
  if (user.verified === true) {
    res.status(400).json({ message: "Unexpected Error" });
    return;
  }

  const token = jwt.sign({ email: email }, JWT_SECRET, {
    expiresIn: "20M",
  });

  try {
    await sendPasswordVerificationMail(email, token);
    await pool.query(
      "UPDATE users SET last_attempted_verification = $1 WHERE email = $2",
      [new Date(), email]
    );
  } catch (err) {
    console.error(err);
  }
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
    const result = await pool.query(selectUsersByEmail, [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "20M" }
      );

      try {
        await sendPasswordRecoveryMail(email, token);
      } catch (err) {
        console.error(err);
      }
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

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Missing token" });
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

  const result = await pool.query(selectUsersByEmail, [decoded.email]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await pool.query("UPDATE users SET verified = $1 WHERE email = $2", [
    true,
    decoded.email,
  ]);

  res.status(200).json({ message: "User verified" });
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

  const result = await pool.query(selectUsersByEmail, [decoded.email]);
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

export async function checkEmailVerification(req: Request, res: Response) {
  const { email } = req.body;
  if (typeof email !== "string") {
    res.status(400).json({ error: "Email required" });
    return;
  }

  const result = await pool.query(
    "SELECT verified FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ verified: result.rows[0].verified });
}
