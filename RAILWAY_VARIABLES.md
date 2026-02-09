# Variables de entorno en Railway

Crea estas variables en **Railway → tu servicio → Variables** (o en el servicio de PostgreSQL y enlázalo).

---

## Obligatorias (crear siempre)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión PostgreSQL. Si añades el plugin PostgreSQL en Railway, Railway la crea y la inyecta automáticamente. | (lo asigna Railway) |
| `JWT_SECRET` | Clave para firmar tokens JWT. **Mínimo 32 caracteres**, aleatoria. | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Email del usuario admin inicial (se crea al primer arranque). | `admin@heydoctor.health` |
| `ADMIN_PASSWORD` | Contraseña del admin. | Una contraseña segura |
| `ADMIN_NAME` | Nombre del admin. | `Dr. Jairo Santana` |

---

## Recomendadas

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | Pon `production` para validaciones estrictas (DATABASE_URL, JWT_SECRET) al arrancar. |

---

## No crear (Railway las asigna)

| Variable | Nota |
|----------|------|
| `PORT` | Railway la asigna automáticamente. No la definas. |

---

## Opcionales

| Variable | Uso |
|----------|-----|
| `BASE_URL` | URL pública del backend (para enlaces en PDFs, emails). Ej: `https://tu-proyecto.up.railway.app` |
| `FRONTEND_URL` | URL del frontend en Vercel (para CORS o enlaces). |
| `ONESIGNAL_APP_ID` | Notificaciones push. |
| `ONESIGNAL_REST_API_KEY` | Notificaciones push. |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` | Web Push (notificaciones). |

---

## Cómo obtener DATABASE_URL en Railway

1. En tu proyecto Railway, añade el plugin **PostgreSQL** (New → Database → PostgreSQL).
2. En el servicio del **backend**, pestaña Variables → **Add variable** → **Add reference**.
3. Elige el servicio PostgreSQL y la variable `DATABASE_URL`.
4. Railway la inyectará en cada deploy.

Si usas una base externa, crea la variable `DATABASE_URL` manualmente con la cadena de conexión completa (incluye `?sslmode=require` si el proveedor lo exige).
