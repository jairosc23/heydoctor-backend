# Despliegue en Railway – HeyDoctor Backend

## Estructura del repo

- **Repo jairosc23/heydoctor (monorepo):** el backend está en la carpeta `backend/` → Root Directory en Railway: **`backend`** (sin barra).
- **Repo solo-backend (p. ej. heydoctor-backend):** si `package.json` y `server.js` están en la raíz del repo → Root Directory: vacío o **`/`**.

Si ves *"Could not find root directory: backend"*: comprueba que el repo que conectaste tiene una carpeta llamada `backend/` en la raíz. Si no (backend en la raíz), deja Root Directory vacío. Más detalle en **[../RAILWAY_ROOT.md](../RAILWAY_ROOT.md)** (en la raíz del repo).

## Configuración en Railway

### 1. Conectar el repositorio

- Repositorio: el que uses (p. ej. `jairosc23/heydoctor`).
- Root Directory:
  - Si el backend está en la carpeta `backend/`: **`backend`** (valor exacto, sin `/`).
  - Si el backend está en la raíz del repo: dejar vacío o **`/`**

### 2. Variables de entorno

Lista exacta y descripción: **[RAILWAY_VARIABLES.md](./RAILWAY_VARIABLES.md)**.

- **Obligatorias:** `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
- **Recomendada:** `NODE_ENV=production`
- **No crear:** `PORT` (Railway la asigna)

### 3. Build y deploy

Railway usa:

- **Build:** `npm ci` (Nixpacks)
- **Start:** `node server.js` (Procfile / `package.json`)

No hace falta configurar el comando de arranque si `package.json` tiene `"start": "node server.js"`.

### 4. Puerto

Railway asigna `PORT`. El código usa `process.env.PORT || 8080`.

## Verificación

```bash
# GET → 405 JSON
curl https://TU_URL/auth/login

# POST → JSON con token
curl -X POST https://TU_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@heydoctor.health","password":"123456"}'
```

Si devuelve JSON (no HTML), el backend está desplegado correctamente.

---

## Validación final (producción)

1. **Railway levanta el backend sin errores**  
   Revisa los logs en Railway; no debe haber `process.exit(1)` por falta de `DATABASE_URL` o `JWT_SECRET`.

2. **POST /auth/login responde JSON válido**  
   Debe devolver `{ "token": "...", "user": { "id", "email", "name" } }`.  
   Si ves HTML o 404, comprueba Root Directory = `backend` y que el servicio es el backend (no el frontend).

3. **Nunca retorna HTML**  
   Cualquier ruta (incluidas rutas inexistentes y errores) debe responder con `Content-Type: application/json` y cuerpo JSON.

---

## URL del backend para Vercel (VITE_API_URL)

Tras el deploy en Railway:

1. En Railway → tu **servicio backend** → **Settings** → **Networking** → **Generate Domain** (o usa el dominio que ya tengas).
2. La URL será del tipo: `https://tu-servicio.up.railway.app` (o el dominio personalizado que configures).
3. En **Vercel** (proyecto del frontend) → **Settings** → **Environment Variables**:
   - Nombre: `VITE_API_URL`
   - Valor: `https://tu-servicio.up.railway.app` (la URL de Railway **sin** barra final)
   - Entorno: Production (y Preview si quieres)
4. **Redeploy** el frontend en Vercel para que use la nueva variable.

Ejemplo: si Railway te asigna `https://heydoctor-backend-production.up.railway.app`, en Vercel pon  
`VITE_API_URL=https://heydoctor-backend-production.up.railway.app`.
