import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// 🔹 Simulación temporal de base de datos:
let AGENDA = [
  // Ejemplo inicial
  // {
  //   id: "1",
  //   paciente: "Juan Pérez",
  //   fecha: "2024-12-20",
  //   hora: "10:00",
  // },
];

// ---------------------------------------------------------------------------
// 🟦 GET — Obtener todas las citas
// ---------------------------------------------------------------------------
router.get("/", auth, async (req, res) => {
  return res.json({
    ok: true,
    agenda: AGENDA,
  });
});

// ---------------------------------------------------------------------------
// 🟩 POST — Crear nueva cita
// ---------------------------------------------------------------------------
router.post("/", auth, async (req, res) => {
  const { paciente, fecha, hora } = req.body;

  if (!paciente || !fecha || !hora) {
    return res.status(400).json({
      ok: false,
      msg: "Todos los campos son obligatorios (paciente, fecha, hora).",
    });
  }

  const cita = {
    id: Date.now().toString(),
    paciente,
    fecha,
    hora,
  };

  AGENDA.push(cita);

  return res.json({
    ok: true,
    msg: "Cita creada correctamente",
    cita,
  });
});

// ---------------------------------------------------------------------------
// 🟨 PUT — Editar una cita existente
// ---------------------------------------------------------------------------
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { paciente, fecha, hora } = req.body;

  const index = AGENDA.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
  }

  AGENDA[index] = {
    ...AGENDA[index],
    paciente: paciente ?? AGENDA[index].paciente,
    fecha: fecha ?? AGENDA[index].fecha,
    hora: hora ?? AGENDA[index].hora,
  };

  return res.json({
    ok: true,
    msg: "Cita actualizada",
    cita: AGENDA[index],
  });
});

// ---------------------------------------------------------------------------
// 🟥 DELETE — Eliminar cita por ID
// ---------------------------------------------------------------------------
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  const exists = AGENDA.some((c) => c.id === id);

  if (!exists) {
    return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
  }

  AGENDA = AGENDA.filter((c) => c.id !== id);

  return res.json({
    ok: true,
    msg: "Cita eliminada",
  });
});

// EXPORTAR RUTA
export default router;
