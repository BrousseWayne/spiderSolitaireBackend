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

  const jwtSecret: string = process.env.JWT_SECRET!;

  const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: "2h",
  });

  res.json({ token });
});

app.post("/register", async (req: Request, res: Response) => {
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

  await pool.query(text, values);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
