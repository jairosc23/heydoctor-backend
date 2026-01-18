import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { db } from "./db.js";

dotenv.config();

const app = express();

// CORS configurado correctamente para Next.js + Producción
app.use(
  cors({
    origin: "*", // puedes restringir luego a tu dominio real
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ------------------------------
// IMPORT ROUTES
// ------------------------------
import authRouter from "./routes/auth.js";
import pacientesRouter from "./routes/pacientes.js";
import agendaRouter from "./routes/agenda.js";
import configRouter from "./routes/config.js";
import notificationsRouter from "./routes/notifications.js"; // ← NUEVO

// ------------------------------
// ENABLE ROUTES
// ------------------------------
app.use("/auth", authRouter);
app.use("/patients", pacientesRouter); // ← Documentos viven aquí
app.use("/pacientes", pacientesRouter); // compatibilidad anterior
app.use("/agenda", agendaRouter);
app.use("/config", configRouter);
app.use("/notifications", notificationsRouter); // ← NUEVO

// ------------------------------
// CREATE ADMIN IF NOT EXISTS
// ------------------------------
async function ensureAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const pass = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME;

    if (!email || !pass || !name) {
      console.warn("⚠ Variables ADMIN_* no configuradas en .env");
      return;
    }

    const check = await db.query(
      "SELECT * FROM users WHERE email=$1 LIMIT 1",
      [email]
    );

    if (check.rows.length === 0) {
      const hash = await bcrypt.hash(pass, 10);
      await db.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)",
        [name, email, hash, "admin"]
      );
      console.log("✔ Usuario administrador creado");
    } else {
      console.log("✔ Admin existente verificado");
    }
  } catch (err) {
    console.error("❌ Error creando admin:", err);
  }
}

// ------------------------------
// START SERVER
// ------------------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  await ensureAdmin();
  console.log(`🚀 HeyDoctor backend corriendo en puerto ${PORT}`);
});
