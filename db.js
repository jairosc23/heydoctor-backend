import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

if (!connectionString || connectionString.trim() === "") {
  console.error(
    "❌ DATABASE_URL no está configurada en Railway Variables.\n" +
    "   Configura: Variables → Add reference → PostgreSQL → DATABASE_URL"
  );
  process.exit(1);
}

export const db = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
