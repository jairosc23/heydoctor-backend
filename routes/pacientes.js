import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  res.json({ ok: true, pacientes: [] });
});

export default router;