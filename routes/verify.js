import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM documents WHERE uuid = $1 LIMIT 1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ valid: false });
    }

    const doc = rows[0];

    res.json({
      valid: true,
      type: doc.type,
      date: doc.created_at,
      doctor: {
        name: doc.doctor_name,
        specialty: doc.doctor_specialty,
        registration: doc.doctor_registration,
        signature: doc.doctor_signature_url,
      },
    });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

export default router;
