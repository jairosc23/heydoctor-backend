import { db } from "../db.js";
import sendNotification from "../utils/onesignal.js";

export const listar = async (req, res) => {
  try {
    const filters = req.body || {};
    let query = "SELECT * FROM auditoria WHERE 1=1";
    let params = [];

    if (filters.fecha) {
      params.push(filters.fecha);
      query += ` AND DATE(fecha) = $${params.length}`;
    }

    if (filters.medico) {
      params.push(filters.medico);
      query += ` AND medico ILIKE '%' || $${params.length} || '%'`;
    }

    if (filters.pais) {
      params.push(filters.pais);
      query += ` AND pais ILIKE '%' || $${params.length} || '%'`;
    }

    if (filters.estado) {
      params.push(filters.estado);
      query += ` AND estado = $${params.length}`;
    }

    query += " ORDER BY fecha DESC";

    const result = await db.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error("Error listando auditoría", err);
    res.status(500).json({ error: "Error interno" });
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id, estado, observacion, auditor } = req.body;

    const update = await db.query(
      `UPDATE auditoria 
       SET estado=$1, observacion=$2, usuario_auditor=$3, fecha_actualizacion=NOW()
       WHERE id=$4 RETURNING *`,
      [estado, observacion || null, auditor || null, id]
    );

    const doc = update.rows[0];

    await sendNotification({
      title: `Documento ${doc.documento}`,
      body:
        estado === "aprobado"
          ? "Su documento fue verificado y aprobado."
          : estado === "rechazado"
          ? "Su documento fue rechazado. Revise las observaciones."
          : "El estado del documento cambió.",
      user: doc.medico,
    });

    res.json({ ok: true, data: doc });

  } catch (err) {
    console.error("Error actualizando auditoría:", err);
    res.status(500).json({ error: "Error interno" });
  }
};
