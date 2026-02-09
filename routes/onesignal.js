// routes/onesignal.js
import express from "express";
import OneSignal from "@onesignal/node-onesignal";

const router = express.Router();

const appId = process.env.ONESIGNAL_APP_ID;
const restKey = process.env.ONESIGNAL_REST_API_KEY;

const config = OneSignal.createConfiguration({
  userAuthKey: "",
  restApiKey: restKey,
});

const client = new OneSignal.DefaultApi(config);

async function sendNotification({ title, message, url }) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = appId;
    notification.included_segments = ["All"];
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.url = url;
    notification.chrome_web_icon = "https://heydoctor.health/icon.png";

    const result = await client.createNotification(notification);
    console.log("🔔 Notificación enviada:", result.id);
    return { ok: true };
  } catch (err) {
    console.error("❌ Error enviando notificación:", err);
    return { ok: false };
  }
}

// Envío custom: { title, message } o { title, message, url }
router.post("/send", async (req, res) => {
  const { title, message, url } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "title y message son requeridos" });
  }

  await sendNotification({
    title,
    message,
    url: url || "https://heydoctor.health",
  });

  res.json({ ok: true });
});

router.post("/verified", async (req, res) => {
  const { tipo, pais, title, message } = req.body;

  if (title && message) {
    await sendNotification({
      title,
      message,
      url: "https://heydoctor.health",
    });
  } else {
    await sendNotification({
      title: "Documento HeyDoctor verificado",
      message: `Un ${tipo || "documento"} fue verificado desde ${pais || "—"}. Estado: válido ✓`,
      url: "https://heydoctor.health/dashboard/auditoria",
    });
  }

  res.json({ ok: true });
});

router.post("/interconsulta", async (req, res) => {
  const { paciente } = req.body;

  await sendNotification({
    title: "Nueva interconsulta registrada",
    message: `Se generó una interconsulta para ${paciente}.`,
    url: "https://heydoctor.health/dashboard/interconsultas",
  });

  res.json({ ok: true });
});

router.post("/receta", async (req, res) => {
  const { paciente } = req.body;

  await sendNotification({
    title: "Receta digital emitida",
    message: `Una nueva receta para ${paciente} está disponible.`,
    url: "https://heydoctor.health/dashboard/documentos",
  });

  res.json({ ok: true });
});

export default router;
