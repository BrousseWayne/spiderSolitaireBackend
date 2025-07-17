import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { Pool } from "pg";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

dotenv.config({ path: "/Users/samy/Projects/spiderBackend/conf.env" });

dotenv.config();

//TODO: match cookie expiration with token expiration

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET!;
const CLIENT_ORIGIN = "http://localhost:5173";

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true, // allow cookies
  })
);
app.use(express.json());
app.use(cookieParser());

const pool = new Pool();

app.post("/login", async (req: Request, res: Response) => {
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

    const jwtSecret: string | undefined = JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "2h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/register", async (req: Request, res: Response) => {
  try {
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
    const text =
      "INSERT INTO users(email, password) VALUES($1, $2) RETURNING *";

    const insertedUser = await pool.query(text, values);

    res.status(201).json({
      message: "User registered",
      user: insertedUser.rows[0].email,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/verify-token", (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    res.sendStatus(200);
    return;
  } catch {
    res.sendStatus(401);
    return;
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

//TODO: Log out
//TODO: Expiration token handling ?
