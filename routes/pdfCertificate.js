import express from "express";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { generateQR } from "../utils/generateQR.js";

const router = express.Router();

/* ============================================
   CERTIFICADO MÉDICO PDF — HEYDOCTOR
============================================ */

router.get("/certificate/:patientId", async (req, res) => {
  try {
    const patientId = req.params.patientId;

    /* -----------------------------
       1. OBTENER DATOS DEL PACIENTE
    ------------------------------ */
    const { rows } = await db.query(
      "SELECT * FROM patients WHERE id = $1 LIMIT 1",
      [patientId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const patient = rows[0];

    /* -----------------------------
       2. CREAR UUID PARA EL DOCUMENTO
    ------------------------------ */

    const documentId = uuidv4();

    /* -----------------------------
       3. REGISTRAR DOCUMENTO EN BD
    ------------------------------ */

    await db.query(
      `INSERT INTO documents (uuid, type, patient_id, doctor_name, doctor_specialty, doctor_signature_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [
        documentId,
        "certificado",
        patientId,
        "Dr. Jairo Santana",
        "Médico y Cirujano",
        `${process.env.BASE_URL}/public/signature.png`,
      ]
    );

    /* -----------------------------
       4. CREAR PDF
    ------------------------------ */

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=certificado-${patientId}.pdf`
    );

    doc.pipe(res);

    /* -----------------------------
       5. ENCABEZADO + LOGO
    ------------------------------ */

    const logoPath = path.resolve("public/logo.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 40, { width: 90 });

    doc
      .fontSize(22)
      .fillColor("#0f766e")
      .text("HEYDOCTOR", 150, 50);

    doc
      .fontSize(11)
      .fillColor("#444")
      .text("Plataforma de Telemedicina con Certificación Digital", 150, 75);

    doc.moveDown(3);

    /* -----------------------------
       6. TÍTULO DEL DOCUMENTO
    ------------------------------ */

    doc
      .fontSize(20)
      .fillColor("#000")
      .text("CERTIFICADO MÉDICO", { align: "center" });

    doc.moveDown(2);

    /* -----------------------------
       7. CUERPO DEL CERTIFICADO
    ------------------------------ */

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(
        `El(la) paciente: ${patient.name} (RUT: ${patient.rut || "N/A"})`,
        50,
        doc.y
      );

    doc.text(
      `Se encuentra actualmente en evaluación médica y requiere reposo según criterio clínico.`,
      50,
      doc.y + 15
    );

    doc.text(
      `Este certificado es generado y firmado digitalmente por el profesional tratante.`,
      50,
      doc.y + 15
    );

    doc.moveDown(3);

    /* -----------------------------
       8. FIRMA DEL MÉDICO
    ------------------------------ */

    const signaturePath = path.resolve("public/signature.png");

    if (fs.existsSync(signaturePath)) {
      doc.image(signaturePath, 50, doc.y, { width: 160 });
    }

    doc.moveDown(3);

    doc
      .fontSize(12)
      .text("Dr. Jairo Santana", 50)
      .text("Médico y Cirujano", 50)
      .text("Registro: XXXXXXX", 50)
      .text("HeyDoctor Health", 50);

    doc.moveDown(2);

    /* -----------------------------
       9. SELLO PROFESIONAL
    ------------------------------ */

    const sealPath = path.resolve("public/seal.png");
    if (fs.existsSync(sealPath)) {
      doc.image(sealPath, 340, doc.y - 90, { width: 120, opacity: 0.9 });
    }

    /* -----------------------------
       10. GENERAR QR DE VERIFICACIÓN
    ------------------------------ */

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${documentId}`;
    const qrImage = await generateQR(verifyUrl);

    doc.image(qrImage, 430, 60, { width: 120 });

    /* -----------------------------
       11. CODIGOS DE VERIFICACIÓN
    ------------------------------ */

    doc
      .fontSize(10)
      .fillColor("#555")
      .text(`Documento ID: ${documentId}`, 50, 760)
      .text(`Verificar autenticidad en: ${verifyUrl}`, 50, 775);

    /* -----------------------------
       12. FINALIZAR PDF
    ------------------------------ */

    doc.end();
  } catch (err) {
    console.error("Error en PDF:", err);
    res.status(500).json({ error: "Error generando certificado" });
  }
});

export default router;
