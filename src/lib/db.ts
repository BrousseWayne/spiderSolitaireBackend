import { Pool } from "pg";
export const pool = new Pool();

export const selectUsersByEmail = "SELECT * FROM users WHERE email = $1";
