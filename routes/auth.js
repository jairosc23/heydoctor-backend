import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = express.Router();

router.get("/login", (req, res) => {
  res.status(405).json({ error: "Method Not Allowed", message: "Use POST /auth/login" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const query = await db.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = query.rows[0];

  if (!user) return res.status(400).json({ error: "Usuario no existe" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: "Contraseña incorrecta" });

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: "Servicio no configurado (JWT_SECRET)" });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    secret,
    { expiresIn: "12h" }
  );

  // Respuesta en formato producción: { token, user } sin datos sensibles
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export default router;