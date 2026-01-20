import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ------------------------------------------------------
   VERIFICACIÓN GENERAL DE DOCUMENTOS
   Tipos: certificate, interconsult, prescription
------------------------------------------------------ */
router.get("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;

    // Validar tipo
    const validTypes = ["certificate", "interconsult", "prescription"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Tipo de documento no válido" });
    }

    // Buscar paciente
    const { rows } = await db.query("SELECT * FROM patients WHERE id = $1", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const patient = rows[0];

    // Página HTML simple y profesional
    const html = `
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Verificación HeyDoctor</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f1f1f1;
            padding: 40px;
          }
          .card {
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .title {
            color: #0d9488;
            font-size: 24px;
            font-weight: bold;
          }
          .label {
            margin-top: 15px;
            font-weight: bold;
            color: #555;
          }
          .value {
            margin-bottom: 10px;
            color: #111;
          }
          .ok {
            color: #0d9488;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>

      <body>
        <div class="card">
        
          <div class="title">Documento verificado ✔</div>

          <div class="label">Tipo de documento:</div>
          <div class="value">${type}</div>

          <div class="label">Paciente:</div>
          <div class="value">${patient.name}</div>

          <div class="label">RUT / ID:</div>
          <div class="value">${patient.rut || "Sin registro"}</div>

          <div class="label">Estado:</div>
          <div class="ok">Documento autenticado por HeyDoctor™</div>

          <div class="footer">
            HeyDoctor — Plataforma Médica Digital<br/>
            Documento emitido digitalmente. Válido sin firma manuscrita.
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);

  } catch (error) {
    console.error("❌ Error en verificación:", error);
    res.status(500).send("Error verificando documento");
  }
});

export default router;

