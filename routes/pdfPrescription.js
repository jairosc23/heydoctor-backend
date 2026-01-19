import express from "express";
import { db } from "../db.js";
import { createBasePDF } from "../utils/pdfCommon.js";

const router = express.Router();

/* ---------------------------------------------------------
   📄 RECETA MÉDICA PDF
   Ruta: GET /pdf/prescription/:id
--------------------------------------------------------- */
router.get("/prescription/:id", async (req, res) => {
  try {
    const patientId = req.params.id;

    // ----------------------------
    // 1. Datos del médico
    // ----------------------------
    const doctorRes = await db.query("SELECT * FROM doctor LIMIT 1");
    const doctor = doctorRes.rows[0];

    // ----------------------------
    // 2. Datos del paciente
    // ----------------------------
    const patientRes = await db.query(
      "SELECT * FROM patients WHERE id = $1",
      [patientId]
    );

    const patient = patientRes.rows[0];

    if (!patient) {
      return res.status(404).send("Paciente no encontrado");
    }

    // ----------------------------
    // 3. Último PLAN (tratamiento recomendado)
    // ----------------------------
    let treatment = "No se registraron indicaciones médicas.";

    if (patient.history && patient.history.length > 0) {
      const hx = patient.history[patient.history.length - 1];
      if (hx.plan) treatment = hx.plan;
    }

    // ----------------------------
    // 4. Crear PDF base
    // ----------------------------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=receta_${patientId}.pdf`
    );

    const doc = createBasePDF(res, {
      title: "Receta Médica",
      doctorName: doctor.name,
      doctorRole: doctor.specialty,
      signatureFile: "signature.png",
      sealFile: "seal.png",
      verificationUrl: "https://heydoctor.health/verify",
    });

    // ----------------------------
    // 5. Encabezado del documento
    // ----------------------------
    doc
      .fontSize(18)
      .fillColor("#0d9488")
      .text("RECETA MÉDICA", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(12)
      .fillColor("black")
      .text(`Paciente: ${patient.name}`)
      .text(`RUT / ID: ${patient.rut || "No registrado"}`)
      .text(`Fecha de emisión: ${new Date().toLocaleString("es-CL")}`)
      .moveDown(2);

    // ----------------------------
    // 6. Indicaciones médicas / tratamiento
    // ----------------------------
    doc
      .fontSize(12)
      .fillColor("black")
      .text("INDICACIONES MÉDICAS:", { underline: true })
      .moveDown(1);

    doc
      .fontSize(12)
      .text(treatment, {
        align: "left",
      })
      .moveDown(2);

    // ----------------------------
    // 7. Firma + sello
    // ----------------------------
    doc.addSignatureBlock();

    // ----------------------------
    // 8. QR con verificación
    // ----------------------------
    await doc.addVerificationQR(patientId);

    // ----------------------------
    // 9. Finalizar PDF
    // ----------------------------
    doc.end();
  } catch (err) {
    console.error("❌ Error generando receta PDF:", err);
    res.status(500).send("Error interno al generar receta PDF");
  }
});

export default router;

