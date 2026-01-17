import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/* --------------------------------------------------
   GET — OBTENER AGENDA
-------------------------------------------------- */
router.get("/", auth, async (req, res) => {
  try {
    // Más adelante conectaremos a MySQL, PostgreSQL o Mongo
    res.json({
      ok: true,
      agenda: [],
    });
  } catch (error) {
    console.error("Error en GET /agenda:", error);
    res.status(500).json({ ok: false, msg: "Error en servidor" });
  }
});

/* --------------------------------------------------
   POST — CREAR NUEVA CITA
-------------------------------------------------- */
router.post("/", auth, async (req, res) => {
  try {
    const { paciente, fecha, hora, motivo } = req.body;

    // Validaciones mínimas
    if (!paciente || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        msg: "Paciente, fecha y hora son obligatorios",
      });
    }

    // Por ahora generamos una cita "fake" hasta conectar BD
    const nuevaCita = {
      id: Date.now(),
      paciente,
      fecha,
      hora,
      motivo: motivo || "",
    };

    res.json({
      ok: true,
      msg: "Cita creada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("Error en POST /agenda:", error);
    res.status(500).json({ ok: false, msg: "Error creando cita" });
  }
});

export default router;
