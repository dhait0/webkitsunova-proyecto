# DEPLOYMENT — WebKitsunova

Guía de despliegue para el proyecto WebKitsunova.

---

## SUPABASE

### 1. Crear proyecto
1. Ve a https://supabase.com
2. Click "New Project"
3. Nombre: `webkitsunova`
4. Password: elige una segura
5. Región: la más cercana a tu ubicación
6. Click "Create new project"

### 2. Obtener credenciales
Ve a tu proyecto → Settings → API (o Database → Connection strings):

- **Project URL**: `https://xxxxx.supabase.co`
- **publishable key**: `eyJhbG...` (PÚBLICO — se usa en el frontend)
- **secret key**: `eyJhbG...` (SECRETO — se usa SOLO en el backend)

### 3. Configurar variables de entorno locales
```bash
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SECRET_KEY="eyJhbG..."
export VITE_SUPABASE_URL="https://xxxxx.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbG..."
```

### 4. Conexión PostgreSQL
Ve a Supabase → Project Settings → Database → Connection strings.
Dos opciones:
- **Connection string** (directa): para `prisma generate` y `prisma migrate deploy`
- **Connection string with pooler**: para aplicaciones serverless (recomendado)

Configura en `.env` o variables del entorno:
- `DATABASE_URL` — conexión con pooler (transaction pooler, pgbouncer en puerto 6543, para runtime Prisma/Express en Vercel)
- `DIRECT_URL` — conexión directa (puerto 5432, sin pgbouncer, para `prisma generate` y `prisma migrate deploy` local)

### 5. Sincronizar esquema Prisma

Localmente (con Docker corriendo), usa `prisma migrate dev` para crear y aplicar la migración desde el schema:
```bash
cd backend
npx prisma migrate dev --name init
```

Contra Supabase (cuando tengas DATABASE_URL y DIRECT_URL configurados):
```bash
cd backend
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

**IMPORTANTE**: No uses `prisma db push` — ya tenemos migraciones formales (`migrate deploy` es el comando correcto para aplicar migraciones en producción/staging).

### 5b. Migración de datos (si aplica)
Si provienes de una base de datos existente (ej. PHP/MySQL legado):
1. Exporta datos del sistema origen
2. Transforma al esquema Prisma (User, Profile, PsychologistProfile, Session)
3. Importa en Supabase via `psql` o cliente SQL
4. Verifica integridad referencial
5. Ajusta secuencias/ids si es necesario

### 6. Ejecutar SQL de RLS
Ve a Supabase → SQL Editor → Editor.
Abre `backend/supabase/migrations/rls.sql` y haz click "Run".
Esto habilita Row Level Security en las tablas de la aplicación.

### 6b. Seed de administrador (local legacy)
El seed de backend crea un usuario con `passwordHash` legacy para desarrollo local con Docker:
```bash
cd backend
npm run db:seed
```
**IMPORTANTE**: Este seed es LEGACY y **no sirve para iniciar sesión como
administrador**. Escribe `role: ADMIN` en la tabla `User` de Prisma, pero el
login se valida contra Supabase Auth, que nunca consulta esa tabla. El propio
seed lo avisa por consola. Úsalo solo para datos de desarrollo.

### 6c. Crear el primer administrador

El rol vive en `app_metadata.role` de Supabase. Ese es el único lugar del que
leen tanto el frontend como el middleware del backend.

Por SQL (Supabase → SQL Editor), sustituye el correo y el UUID del usuario:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"ADMIN"}'::jsonb
where email = 'tu@correo.com';
```

El valor debe ser exactamente `ADMIN`, en mayúsculas. Cualquier otra variante
(`admin`, `administrator`) se normaliza a `USER` y el panel no abrirá.

Después **cierra sesión y vuelve a entrar**: el token de Supabase lleva una copia
del `app_metadata` y no se refresca solo.

Una vez exista un administrador, el resto de roles se gestionan desde el panel
con `PATCH /api/admin/users/:id/role`, que escribe a la vez en Supabase y en
Prisma. Un administrador no puede cambiar su propio rol.

### 7. Configurar Auth
- URL de callback: `https://tu-frontend.vercel.app/` (o `http://localhost:5174` en dev)
- En Supabase → Authentication → Settings → URL de confección

### 8. Configurar MFA
El frontend implementa MFA TOTP completa:
- **Enrollment**: `/mfa/enroll` (autenticado) → `supabase.auth.mfa.enroll({ factorType: 'totp' })` → QR + secret → verify
- **Login con MFA**: LoginPage verifica AAL level → si `aal1` + `nextLevel: aal2` → redirige a `/mfa/verify`
- **Configuración**: `/mfa/settings` (autenticado) → activar/desactivar MFA, listar factores
- **Backend**: `GET /api/auth/mfa/status` verifica si usuario tiene MFA habilitado

En Supabase → Authentication → MFA → Habilitar TOTP.

### 9. Configurar redirect URLs
- Supabase → Authentication → Settings
- Agregar: `http://localhost:5174/**` (dev)
- Agregar: `https://tu-frontend.vercel.app/**` (prod)

---

## VERCEL

### Proyecto Frontend

### 1. Crear proyecto
1. Ve a https://vercel.com/dashboard
2. Click "Add New Project"
3. Importa desde GitHub: selecciona el repositorio `webkitsunova-proyecto`
4. Selecciona la carpeta `frontend/`
5. Click "Deploy"

### 2. Configuración del proyecto frontend

**Build command**: `npm run build`
**Output directory**: `dist`
**Framework presetable**: Vite (se detecta automáticamente por `vite.config.ts`)

### 3. Variables de entorno (Frontend)
En Vercel → tu proyecto frontend → Settings → Environment Variables:

| Nombre | Valor | Tipo |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Prepared |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbG...` | Prepared |
| `VITE_API_URL` | `https://tu-backend.vercel.app/api` | Prepared |

**IMPORTANTE**: Variables con prefijo `VITE_` se exponen al frontend. Nunca pongas secretos con este prefijo.

### 4. Dominios
Vercel → Settings → Domains:
- Agrega tu dominio personalizado si lo tienes
- Vercel provee SSL automáticamente

---

### Proyecto Backend

### 1. Crear proyecto
1. Ve a https://vercel.com/dashboard
2. Click "Add New Project"
3. Importa desde GitHub: selecciona el repositorio `webkitsunova-proyecto`
4. Selecciona la carpeta `backend/`
5. Click "Deploy"

### 2. Configuración del proyecto backend

**Build command**: `npm run build`
**Framework presetable**: Node.js (se detecta por `package.json`)

### 3. Variables de entorno (Backend)
En Vercel → tu proyecto backend → Settings → Environment Variables:

| Nombre | Valor | Tipo |
|---|---|---|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Secret |
| `SUPABASE_SECRET_KEY` | `eyJhbG...` | Secret |
| `DATABASE_URL` | (URL de conexión Supabase) | Secret |
| `DIRECT_URL` | (URL con pooler Supabase) | Secret |
| `FRONTEND_URL` | `https://tu-frontend.vercel.app` | Prepared |
| `CORS_ORIGIN` | `https://tu-frontend.vercel.app` | Prepared |
| `NODE_ENV` | `production` | Prepared |
| `PORT` | `3002` | Prepared |

**IMPORTANTE**: `SUPABASE_SECRET_KEY` NUNCA debe ser accesible desde el frontend. No uses prefijo `VITE_` para esta variable.

### 4. Dominios y routes
Vercel configura automáticamente:
- Todas las rutas `/api/*` van al backend (definido en `backend/vercel.json`)
- El frontend Vercel maneja las rutas React SPA automáticamente

### 5. Configurar FRONTEND_URL
`FRONTEND_URL` debe apuntar a la URL de tu frontend desplegado en Vercel:
```
FRONTEND_URL=https://tu-frontend.vercel.app
```

Esto se usa en CORS para permitir únicamente al frontend en producción.

### 6. Verificar despliegue
Una vez desplegado:
- Frontend: `https://tu-frontend.vercel.app`
- Backend health check: `https://tu-backend.vercel.app/api/health`

---

## Orden de despliegue

1. ✅ Crear proyecto Supabase
2. ✅ Obtener credenciales
3. ✅ Desplegar backend en Vercel (con variables de entorno)
4. ✅ Desplegar frontend en Vercel (con variables de entorno)
5. ✅ Sincronizar esquema Prisma (`npm run db:push` contra Supabase)
6. ✅ Ejecutar SQL de RLS (Supabase SQL Editor)
7. ✅ Verificar endpoints
8. ✅ Probar registro/login flujo completo

## Verificación post-despliegue

```bash
# Health check backend
curl https://tu-backend.vercel.app/api/health

# Test registro (debería retornar success: true)
curl -X POST https://tu-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test12345"}'

# Test login (debería retornar success: true)
curl -X POST https://tu-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test12345"}'

# Test sin auth (debería retornar 401)
curl https://tu-backend.vercel.app/api/auth/me
```
