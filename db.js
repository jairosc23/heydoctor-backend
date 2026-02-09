import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Railway (rlwy.net, railway) y otros clouds usan SSL; en local puede no tenerlo
const connectionString = process.env.DATABASE_URL;
const useSSL =
  connectionString &&
  (connectionString.includes("sslmode=") ||
    connectionString.includes("railway") ||
    connectionString.includes("rlwy.net"));

export const db = new pg.Pool({
  connectionString,
  ...(useSSL && { ssl: { rejectUnauthorized: false } }),
});