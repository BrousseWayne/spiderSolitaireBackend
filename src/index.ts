import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { Pool } from "pg";
import type { Request, Response } from "express";

dotenv.config({ path: "/Users/samy/Projects/spiderBackend/conf.env" });

const PORT = process.env.PORT;
const app = express();

const corsOption = {
  origin: ["http://localhost:5173"],
};

app.use(helmet());
app.use(cors(corsOption));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LOGIN PLEASEEEE");
});

const pool = new Pool();

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(email, password);
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  console.log(result.rows);

  if (result.rows.length === 0) {
    res.status(401).json({ error: "Invalid credential" });
    return;
  }

  const user = result.rows[0];
  console.log(user.password === password);
  if (user.password !== password) {
    res.status(401).json({ error: "Invalid credential" });
    return;
  }

  res.json({ token: "YEAHAHAHAHAHAHAHAHAHAHA" });
  console.log("dit it wwww");
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
