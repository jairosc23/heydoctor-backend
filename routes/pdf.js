import express from "express";
import PDFDocument from "pdfkit";
import { db } from "../db.js";

const router = express.Router();

// LOGO opcional
const LOGO_PATH = "public/logo-heydoctor.png";

// Función para generar encabezado
function pdfHeader(doc, doctor) {
  doc
    .fontSize(20)
    .fillColor("#0d9488")
    .text("HeyDoctor", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor("#333")
    .text(`${doctor.name}`, { align: "center" })
    .text(`${doctor.specialty}`, { align: "center" })
    .text(`Registro: ${doctor.registration}`, { align: "center" })
    .moveDown();
}

// Función para firma
function pdfSignature(doc, doctor) {
  if (doctor.signature) {
    try {
      doc
        .image(Buffer.from(doctor.signature.split(",")[1], "base64"), {
          width: 180,
          align: "left",
        })
        .moveDown(0.5);
    } catch {
      console.log("Error cargando firma");
    }
  }

  doc
    .fontSize(10)
    .text("__________________________________", { align: "left" })
    .text(`${doctor.name}`, { align: "left" })
    .text(`${doctor.specialty}`, { align: "left" })
    .text(`Registro: ${doctor.registration}`, { align: "left" })
    .moveDown();
}


// -----------------------------------------------
// HISTORIA CLÍNICA PDF
// -----------------------------------------------
router.get("/patients/:id/history/pdf", async (req, res) => {
  try {
    const doctorRes = await db.query("SELECT * FROM doctor LIMIT 1");
    const doctor = doctorRes.rows[0];

    const patRes = await db.query("SELECT * FROM patients WHERE id=$1", [
      req.params.id,
    ]);
    const patient = patRes.rows[0];

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    pdfHeader(doc, doctor);

    doc.fontSize(16).text("Historia Clínica", { underline: true }).moveDown();

    doc
      .fontSize(12)
      .text(`Paciente: ${patient.name}`)
      .text(`ID: ${patient.id}`)
      .moveDown();

    if (patient.history && patient.history.length > 0) {
      const last = patient.history[patient.history.length - 1];

      doc
        .fontSize(14)
        .text("S (Subjetivo):")
        .fontSize(12)
        .text(last.subjective)
        .moveDown();

      doc.fontSize(14).text("O (Objetivo):");
      doc.fontSize(12).text(last.objective).moveDown();

      doc.fontSize(14).text("A (Diagnóstico):");
      doc.fontSize(12).text(last.diagnosis).moveDown();

      doc.fontSize(14).text("P (Plan):");
      doc.fontSize(12).text(last.plan).moveDown();
    } else {
      doc.text("No hay historia clínica registrada.");
    }

    doc.moveDown(2);
    pdfSignature(doc, doctor);

    doc.end();
  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).type("json").json({ error: "Error generando PDF" });
  }
});

export default router;

