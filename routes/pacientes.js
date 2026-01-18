import express from "express";
import multer from "multer";
import { db } from "../db.js";

const router = express.Router();

// Carpeta temporal local
const upload = multer({ dest: "uploads/" });

/* ---------------------------------------
   OBTENER PACIENTE POR ID
---------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM patients WHERE id = $1 LIMIT 1",
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error cargando paciente:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ---------------------------------------
   SUBIR DOCUMENTO DEL PACIENTE
---------------------------------------- */
router.post("/:id/files", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // URL pública del archivo (puede migrarse a Cloudinary/S3 después)
    const fileUrl = `${process.env.BASE_URL}/uploads/${file.filename}`;

    await db.query(
      `UPDATE patients
        SET files = COALESCE(files, '[]'::jsonb) || jsonb_build_object(
          'filename', $1,
          'url', $2
        )
        WHERE id = $3`,
      [file.originalname, fileUrl, req.params.id]
    );

    res.json({ success: true, url: fileUrl });

  } catch (err) {
    console.error("❌ Error subiendo archivo:", err);
    res.status(500).json({ error: "Error al subir archivo" });
  }
});


/* ---------------------------------------
   GUARDAR HISTORIA CLÍNICA (SOAP + CIE10)
---------------------------------------- */
router.post("/:id/history", async (req, res) => {
  const { subjective, objective, diagnosis, plan } = req.body;

  try {
    await db.query(
      `UPDATE patients 
        SET history = COALESCE(history, '[]'::jsonb) || jsonb_build_object(
          'date', NOW(),
          'subjective', $1,
          'objective', $2,
          'diagnosis', $3,
          'plan', $4
        )
      WHERE id = $5`,
      [
        subjective,
        objective,
        JSON.stringify(diagnosis), // diagnóstico CIE10 como JSON
        plan,
        req.params.id
      ]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("❌ Error guardando historia clínica:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
