import { Pool } from "pg";
export const pool = new Pool();

export const selectUsersByEmail = "SELECT * FROM users WHERE email = $1";
export const createTableUser = "";
export const createTableStats = "";
export const createDatabase = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          verified BOOLEAN DEFAULT false,
          has_completed_onboarding BOOLEAN DEFAULT false,
          last_attempted_verification TIMESTAMPTZ
        );
      `);

    const stats = await pool.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        games_played INTEGER DEFAULT 0,
        wins_1_suit INTEGER DEFAULT 0,
        wins_2_suits INTEGER DEFAULT 0,
        wins_4_suits INTEGER DEFAULT 0,
        losses_1_suit INTEGER DEFAULT 0,
        losses_2_suits INTEGER DEFAULT 0,
        losses_4_suits INTEGER DEFAULT 0,
        profile_picture TEXT,
        nickname TEXT,
        default_game_mode INTEGER CHECK (default_game_mode IN (1, 2, 4)),
        has_default_mode BOOLEAN DEFAULT false
      );
    `);
  } catch (err) {
    console.error(err);
  }
};

(async () => {
  await createDatabase();
})();
