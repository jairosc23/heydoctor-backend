import express from "express";
import webpush from "web-push";

const router = express.Router();

const subscriptions = []; // En producción -> MongoDB

webpush.setVapidDetails(
  "mailto:admin@heydoctor.health",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

router.post("/subscribe", async (req, res) => {
  const sub = req.body;
  subscriptions.push(sub);
  res.json({ ok: true });
});

router.post("/send", async (req, res) => {
  const { title, body, url } = req.body;

  for (const sub of subscriptions) {
    await webpush.sendNotification(
      sub,
      JSON.stringify({ title, body, url })
    );
  }

  res.json({ ok: true });
});

export default router;

