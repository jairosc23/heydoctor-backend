import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db.js";

// ======================================
// CARGAR VARIABLES DE ENTORNO
// ======================================
dotenv.config();

const app = express();
app.use(express.json());

// ======================================
// CORS (AJUSTAR EN PRODUCCIÓN)
// ======================================
app.use(
  cors({
    origin: "*", // Cambiar a dominio final en producción
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ======================================
// SERVIR ARCHIVOS ESTÁTICOS
// ======================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/public", express.static(path.join(__dirname, "public"))); // firmas, sellos
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // documentos subidos

// ======================================
// IMPORTAR RUTAS
// ======================================
import authRouter from "./routes/auth.js";
import pacientesRouter from "./routes/pacientes.js";
import agendaRouter from "./routes/agenda.js";
import configRouter from "./routes/config.js";
// TEMPORALMENTE DESHABILITADO: import cie10Router from "./routes/cie.10.js";
import notificationsRouter from "./routes/notifications.js";
import onesignalRoutes from "./routes/onesignal.js";

import pdfCertificateRouter from "./routes/pdfCertificate.js";
import pdfPrescriptionRouter from "./routes/pdfPrescription.js";
import pdfInterconsultRouter from "./routes/pdfInterconsult.js";

// ⭐ RUTA NUEVA — AUDITORÍA
import auditoriaRoutes from "./routes/auditoria.js";

// ======================================
// USAR RUTAS
// ======================================
app.use("/auth", authRouter);
app.use("/pacientes", pacientesRouter);
app.use("/agenda", agendaRouter);
app.use("/config", configRouter);
// TEMPORALMENTE DESHABILITADO: app.use("/cie10", cie10Router);

app.use("/notifications", notificationsRouter);
app.use("/notifications/push", onesignalRoutes); // /notifications/push/verified, /notifications/push/send
app.use("/push", onesignalRoutes); // alias: /push/verified, /push/send

// PDF agrupadas
app.use("/pdf/certificate", pdfCertificateRouter);
app.use("/pdf/prescription", pdfPrescriptionRouter);
app.use("/pdf/interconsult", pdfInterconsultRouter);

// Auditoría
app.use("/auditoria", auditoriaRoutes);

// ======================================
// RUTA DE SALUD Y 404 SIEMPRE JSON (nunca HTML)
// ======================================
app.get("/", (req, res) => {
  res.type("json").json({ ok: true, service: "heydoctor-backend", auth: "POST /auth/login" });
});

app.use((req, res) => {
  res.status(404).type("json").json({ error: "Not Found", path: req.path });
});

// ======================================
// MANEJADOR GLOBAL DE ERRORES — siempre JSON (nunca HTML)
// Captura next(err), errores de express.json(), etc.
// ======================================
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).type("json").json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ======================================
// CREAR TABLA users SI NO EXISTE (Railway / primera vez)
// ======================================
async function ensureUsersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

// ======================================
// CREAR ADMIN SI NO EXISTE
// ======================================
async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.warn("⚠️ Variables ADMIN_* faltan en el archivo .env");
    return;
  }

  const check = await db.query("SELECT * FROM users WHERE email=$1", [
    ADMIN_EMAIL,
  ]);

  if (check.rows.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [ADMIN_NAME, ADMIN_EMAIL, hash, "admin"]
    );

    console.log("✔ Admin creado automáticamente");
  } else {
    console.log("✔ Admin ya existe");
  }
}

// ======================================
// CONFIGURACIÓN DE PRODUCCIÓN (Railway)
// ======================================
const PORT = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  if (!process.env.DATABASE_URL) {
    console.error("❌ En producción DATABASE_URL es obligatorio (Railway lo proporciona).");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("❌ En producción JWT_SECRET es obligatorio y debe tener al menos 32 caracteres.");
    process.exit(1);
  }
}

// ======================================
// LEVANTAR SERVIDOR
// ======================================
app.listen(PORT, async () => {
  try {
    await ensureUsersTable();
    await ensureAdmin();
  } catch (err) {
    console.warn("⚠️ Startup:", err.message);
  }
  console.log(`🚀 HeyDoctor backend corriendo en puerto: ${PORT}`);
});

export { app };
