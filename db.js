import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Railway puede usar DATABASE_URL o DATABASE_PRIVATE_URL
const connectionString =
  process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

if (!connectionString || typeof connectionString !== "string" || !connectionString.startsWith("postgres")) {
  const msg = !connectionString
    ? "DATABASE_URL (o DATABASE_PRIVATE_URL) no está definida en Railway Variables"
    : "DATABASE_URL debe ser una URL PostgreSQL válida (postgresql://...)";
  throw new Error(`❌ ${msg}. Configura la variable en Railway → Variables.`);
}

export const db = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
