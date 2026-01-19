import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { db } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------------------------------
   IMPORTAR RUTAS
---------------------------------------- */
import authRouter from "./routes/auth.js";
import pacientesRouter from "./routes/pacientes.js";
import agendaRouter from "./routes/agenda.js";
import configRouter from "./routes/config.js";
import cie10Router from "./routes/cie10.js";     // ← NUEVA RUTA CIE-10
import notificationsRouter from "./routes/notifications.js"; // ← Notificaciones Web Push (si aplica)
import pdfCertificateRouter from "./routes/pdfCertificate.js";
app.use("/pdf", pdfCertificateRouter);
import pdfPrescriptionRouter from "./routes/pdfPrescription.js";
app.use("/pdf", pdfPrescriptionRouter);
import pdfInterconsultRouter from "./routes/pdfInterconsult.js";
app.use("/pdf", pdfInterconsultRouter);

/* ---------------------------------------
   USAR RUTAS
---------------------------------------- */
app.use("/auth", authRouter);
app.use("/pacientes", pacientesRouter);
app.use("/agenda", agendaRouter);
app.use("/config", configRouter);
app.use("/cie10", cie10Router);                // ← Habilitar búsqueda CIE-10
app.use("/notifications", notificationsRouter); // ← Web Push

/* ---------------------------------------
   CREAR ADMIN AUTOMÁTICO SI NO EXISTE
---------------------------------------- */
async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const pass = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !pass || !name) {
    console.error("❌ ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_NAME faltan en .env");
    return;
  }

  const check = await db.query("SELECT * FROM users WHERE email=$1", [email]);

  if (check.rows.length === 0) {
    const hash = await bcrypt.hash(pass, 10);

    await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)",
      [name, email, hash, "admin"]
    );

    console.log("✔ Usuario administrador creado automáticamente");
  } else {
    console.log("✔ Admin existente detectado");
  }
}

/* ---------------------------------------
   SERVIDOR
---------------------------------------- */
app.listen(process.env.PORT || 8080, async () => {
  await ensureAdmin();
  console.log("🚀 HeyDoctor backend corriendo en puerto:", process.env.PORT || 8080);
});
