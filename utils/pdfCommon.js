// utils/pdfCommon.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

// Ruta absoluta hacia /public (Railway lo permite)
const PUBLIC_PATH = path.resolve("public");

// ------------------------------
// CONFIGURACIÓN DEL PDF
// ------------------------------

export function createBasePDF(res, {
  title = "Documento Médico",
  doctorName = "Dr. Jairo Santana",
  doctorRole = "Médico y Cirujano — HeyDoctor",
  signatureFile = "/signature.png",
  sealFile = "/seal.png",
  verificationUrl = "https://heydoctor.health/verify",
}) {

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, left: 50, right: 50, bottom: 60 }
  });

  // Enviamos PDF como respuesta
  doc.pipe(res);

  // ------------------------------
  // ENCABEZADO HEYDOCTOR
  // ------------------------------
  doc
    .fontSize(20)
    .fillColor("#0d9488")
    .text("HeyDoctor", { align: "left" })
    .moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor("#555")
    .text(title, { align: "left" })
    .moveDown(1);

  // Línea divisoria
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#0d9488")
    .stroke();

  doc.moveDown(1.5);

  // ------------------------------
  // FUNCIÓN PARA INSERTAR FIRMA Y SELLO
  // ------------------------------

  doc.addSignatureBlock = function () {
    const sigPath = path.join(PUBLIC_PATH, signatureFile);
    const sealPath = path.join(PUBLIC_PATH, sealFile);

    // Firma digital
    if (fs.existsSync(sigPath)) {
      doc.image(sigPath, 50, doc.y + 20, { width: 180 });
    }

    // Sello
    if (fs.existsSync(sealPath)) {
      doc.image(sealPath, 240, doc.y + 5, { width: 120 });
    }

    doc.moveDown(4);

    doc
      .fontSize(12)
      .fillColor("#0d9488")
      .text(doctorName)
      .text(doctorRole);
  };

  // ------------------------------
  // FUNCIÓN PARA INSERTAR QR Y VERIFICACIÓN
  // ------------------------------

  doc.addVerificationQR = async function (id) {
    const finalUrl = `${verificationUrl}/${id}`;

    const qr = await QRCode.toDataURL(finalUrl);

    doc
      .image(Buffer.from(qr.split(",")[1], "base64"), 430, doc.y - 30, {
        width: 120,
      });

    doc
      .fontSize(9)
      .fillColor("#555")
      .text(`Validar este documento en:`, 430, doc.y + 90)
      .text(finalUrl, 430, doc.y + 102);
  };

  // ------------------------------
  // PIE DE PÁGINA AUTOMÁTICO
  // ------------------------------

  const footer = (page) => {
    page
      .fontSize(9)
      .fillColor("#999")
      .text(
        "© HeyDoctor — Sistema Clínico Digital — Documento firmado electrónicamente",
        50,
        780,
        { align: "center" }
      );
  };

  doc.on("pageAdded", () => footer(doc));
  footer(doc); // primera página

  return doc;
}


