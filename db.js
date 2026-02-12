import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
<<<<<<< HEAD
    rejectUnauthorized: false,
  },
=======
    rejectUnauthorized: false
  }
>>>>>>> e38b74a (Fix: Simplified DB connection for Railway SSL compatibility)
});
