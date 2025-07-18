import dotenv from "dotenv";

dotenv.config({ path: "/Users/samy/Projects/spiderBackend/conf.env" });

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const SALT_ROUNDS = 10;
export const CLIENT_ORIGIN = "http://localhost:5173";
