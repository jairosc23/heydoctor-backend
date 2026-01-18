import express from "express";
import webpush from "web-push";

const router = express.Router();

// =============================
//   Almacén temporal en memoria
//   (en producción → PostgreSQL)
// =============================
let subscriptions = [];

// =============================
//      CONFIGURACIÓN VAPID
// =============================
webpush.setVapidDetails(
  "mailto:admin@heydoctor.health",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

// =============================
//   REGISTRAR SUSCRIPCIÓN
// =============================
router.post("/subscribe", async (req, res) => {
  try {
    const sub = req.body;

    if (!sub || !sub.endpoint) {
      return res.status(400).json({ error: "Suscripción inválida" });
    }

    // Evitar duplicados
    const exists = subscriptions.find((s) => s.endpoint === sub.endpoint);
    if (!exists) {
      subscriptions.push(sub);
      console.log("🔔 Nueva suscripción:", sub.endpoint);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error registrando suscripción:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// =============================
//   ENVIAR NOTIFICACIÓN
// =============================
router.post("/send", async (req, res) => {
  const { title, body, url } = req.body;

  console.log("📨 Enviando notificaciones… Total:", subscriptions.length);

  let activeSubscriptions = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        sub,
        JSON.stringify({ title, body, url })
      );

      activeSubscriptions.push(sub); // sigue siendo válida

    } catch (error) {
      console.error("⚠️ Error enviando a:", sub.endpoint);

      // Suscripción expirada → eliminar
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log("🗑 Eliminando suscripción expirada");
      } else {
        console.error("❌ Error WebPush:", error);
      }
    }
  }

  // Actualizar lista sin las suscripciones inválidas
  subscriptions = activeSubscriptions;

  res.json({ ok: true, sent: activeSubscriptions.length });
});

export default router;
