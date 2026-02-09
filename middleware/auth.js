import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Token requerido" });

  const secret = process.env.JWT_SECRET;
  if (!secret)
    return res.status(503).json({ error: "Servicio no configurado (JWT_SECRET)" });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Token inválido" });
  }
}