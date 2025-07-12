import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //hash the password with a secure algorithm like bcrypt
  // if valid => send a token
  // else send ?
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
