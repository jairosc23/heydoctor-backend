import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// LISTAR citas
router.get("/", auth, async (req, res) => {
  try {
    // Aquí luego conectaremos a DB
    res.json({
      ok: true,
      agenda: [],
    });
  } catch (error) {
    res.status(500).json({ ok: false, msg: "Error en servidor" });
  }
});

// CREAR nueva cita
router.post("/", auth, async (req, res) => {
  try {
    const { paciente, fecha, hora, motivo } = req.body;

    // Validación básica
    if (!paciente || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        msg: "Paciente, fecha y hora son obligatorios",
      });
    }

    // Aquí más adelante guardamos en BD
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
    res.status(500).json({ ok: false, msg: "Error creando cita" });
  }
});

export default router;
