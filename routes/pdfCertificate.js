import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { db } from "../db.js";

const router = express.Router();

/* -------------------------------------------------
   GENERAR CERTIFICADO MÉDICO PDF
-------------------------------------------------- */
router.post("/:id", async (req, res) => {
  try {
    const patientId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Falta el motivo del certificado" });
    }

    // Datos del paciente
    const { rows } = await db.query("SELECT * FROM patients WHERE id = $1", [
      patientId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const patient = rows[0];

    /* -------------------------------------------------
       PREPARAR EL PDF
    -------------------------------------------------- */
    const filename = `certificate-${patientId}-${Date.now()}.pdf`;
    const outputPath = path.join("public", filename);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    /* -------------------------------------------------
       LOGO / ENCABEZADO HEYDOCTOR
    -------------------------------------------------- */
    doc
      .fontSize(26)
      .fillColor("#0d9488") // teal-600
      .text("HeyDoctor • Certificado Médico", { align: "center" })
      .moveDown();

    doc
      .fontSize(12)
      .fillColor("#333")
      .text("Consultorio HeyDoctor", { align: "center" })
      .text("Dr. Jairo Santana — Médico y Cirujano", { align: "center" })
      .text("Registro Profesional: 202404 | Chile", { align: "center" })
      .moveDown(2);

    /* -------------------------------------------------
       DATOS DEL PACIENTE
    -------------------------------------------------- */
    doc
      .fontSize(14)
      .fillColor("#0d9488")
      .text("Datos del Paciente", { underline: true });

    doc
      .fillColor("#000")
      .fontSize(12)
      .moveDown(0.5)
      .text(`Nombre: ${patient.name}`)
      .text(`ID/RUT: ${patient.rut || "No registrado"}`)
      .text(`Fecha de nacimiento: ${patient.birthdate || "—"}`)
      .moveDown(1.5);

    /* -------------------------------------------------
       CONTENIDO DEL CERTIFICADO
    -------------------------------------------------- */
    doc
      .fontSize(14)
      .fillColor("#0d9488")
      .text("Se certifica que:", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(
        `El paciente antes mencionado requiere el siguiente respaldo clínico:`,
        { align: "justify" }
      )
      .moveDown(0.7)
      .font("Helvetica-Oblique")
      .text(reason, { align: "justify" })
      .moveDown(1.5);

    /* -------------------------------------------------
       FIRMA Y SELLO
    -------------------------------------------------- */
    const signaturePath = path.resolve("public", "signature.png");
    const sealPath = path.resolve("public", "seal.png");

    if (fs.existsSync(signaturePath)) {
      doc.image(signaturePath, 50, doc.y, { width: 180 });
    }

    if (fs.existsSync(sealPath)) {
      doc.image(sealPath, 350, doc.y - 40, { width: 140 });
    }

    doc.moveDown(4);

    doc
      .fontSize(12)
      .text("__________________________", 50)
      .text("Dr. Jairo Santana", 50)
      .text("Médico y Cirujano — Reg. 202404", 50)
      .moveDown(2);

    /* -------------------------------------------------
       QR DE VERIFICACIÓN
    -------------------------------------------------- */
    const verificationUrl = `${process.env.BASE_URL}/verify/certificate/${patientId}`;
    const qrImage = await QRCode.toDataURL(verificationUrl);

    const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");

    const qrPath = path.join("public", `qr-${Date.now()}.png`);
    fs.writeFileSync(qrPath, Buffer.from(qrBase64, "base64"));

    doc.image(qrPath, 430, doc.y, { width: 120 });
    doc.moveDown(3);

    /* -------------------------------------------------
       PIE DE PÁGINA
    -------------------------------------------------- */
    doc
      .fontSize(10)
      .fillColor("#666")
      .text("Documento emitido electrónicamente por HeyDoctor™", {
        align: "center",
      })
      .text("Válido sin firma manuscrita", { align: "center" })
      .text(new Date().toLocaleString("es-CL"), { align: "center" })
      .moveDown();

    doc.end();

    // Esperar archivo
    stream.on("finish", () => {
      return res.json({
        ok: true,
        url: `${process.env.BASE_URL}/public/${filename}`,
      });
    });
  } catch (error) {
    console.error("❌ Error generando certificado:", error);
    res.status(500).json({ error: "Error generando el PDF" });
  }
});

export default router;
