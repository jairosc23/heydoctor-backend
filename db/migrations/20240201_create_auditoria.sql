CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,

    documento VARCHAR(150) NOT NULL,
    medico VARCHAR(150) NOT NULL,
    pais VARCHAR(80) NOT NULL,
    estado VARCHAR(40) NOT NULL DEFAULT 'pendiente',

    pdf_path TEXT NOT NULL,

    fecha TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    observacion TEXT,

    usuario_auditor VARCHAR(150),
    ip_origen VARCHAR(80),
    fuente VARCHAR(120),
    hash_integridad VARCHAR(128),

    INDEX idx_auditoria_estado (estado),
    INDEX idx_auditoria_medico (medico),
    INDEX idx_auditoria_pais (pais),
    INDEX idx_auditoria_fecha (fecha)
);
