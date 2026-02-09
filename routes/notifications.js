import express from "express";
import webpush from "web-push";

const router = express.Router();

// ===================================================
//  TEMPORAL: LISTA EN MEMORIA
//  (Producción: almacenar en PostgreSQL tabla notifications_subscriptions)
// ===================================================
let subscriptions = [];

// ===================================================
//  CONFIGURACIÓN VAPID (WebPush nativo)
// ===================================================
if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) {
  webpush.setVapidDetails(
    "mailto:admin@heydoctor.health",
    process.env.VAPID_PUBLIC,
    process.env.VAPID_PRIVATE
  );
}

// ===================================================
//  REGISTRAR SUSCRIPCIÓN DEL CLIENTE
// ===================================================
router.post("/subscribe", async (req, res) => {
  try {
    const sub = req.body;

    if (!sub || !sub.endpoint) {
      return res.status(400).json({ error: "Suscripción inválida" });
    }

    // Evitar duplicados
    const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);

    if (!exists) {
      subscriptions.push(sub);
      console.log("🔔 Nueva suscripción registrada:", sub.endpoint);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error registrando suscripción:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ===================================================
//  ENVIAR NOTIFICACIÓN A TODAS LAS SUSCRIPCIONES
// ===================================================
router.post("/send", async (req, res) => {
  const { title, body, url } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Título y cuerpo son requeridos" });
  }

  console.log(`🚀 Enviando notificaciones… Total suscritos: ${subscriptions.length}`);

  let active = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify({ title, body, url }));

      active.push(sub); // Sigue activa

    } catch (error) {
      console.error("⚠️ Error enviando a:", sub.endpoint);

      // Suscripción expirada → eliminar
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log("🗑 Eliminando suscripción expirada:", sub.endpoint);
      } else {
        console.error("⚠️ Error WebPush:", error.message || error);
      }
    }
  }

  // Mantener solo suscripciones funcionando
  subscriptions = active;

  res.json({
    ok: true,
    total_sent: active.length,
    removed: active.length - subscriptions.length,
  });
});

export default router;
