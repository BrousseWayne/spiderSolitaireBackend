import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { Pool } from "pg";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config({ path: "/Users/samy/Projects/spiderBackend/conf.env" });

const PORT = process.env.PORT;
const app = express();
const SALT_ROUNDS = 10;

const corsOption = {
  origin: ["http://localhost:5173"],
};

app.use(helmet());
app.use(cors(corsOption));
app.use(express.json());

const pool = new Pool();

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credential" });
      return;
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(401).json({ error: "Invalid credential" });
      return;
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "2h",
    });

    res.json({ token });
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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
