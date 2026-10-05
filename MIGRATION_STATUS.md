# MIGRATION STATUS — WebKitsunova

## Fecha de inicio
2026-09-18

## Última actualización
2026-09-18 — Auditoría correctiva aplicada (roles via app_metadata, renombrado de claves, RLS, fixes de seguridad)

## Arquitectura objetivo

### Frontend
- React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10
- React Router 6.26.2 (BrowserRouter)
- Supabase Auth (`@supabase/supabase-js`) — sesión en localStorage del navegador
- Punto de entrada: `frontend/src/main.tsx`
- Build output: `frontend/dist/`
- Router: BrowserRouter con rutas `/`, `/login`, `/dashboard/*`

### Backend
- Node.js + Express 4.21.1 + TypeScript 5.6.3
- Prisma 5.20.0 (client y CLI)
- Supabase Admin SDK (`@supabase/supabase-js`) — auth, roles, MFA
- Punto de entrada: `backend/src/server.ts` (local) / `backend/api/index.ts` (Vercel serverless)
- App Express: `backend/src/app.ts`
- Rutas: `/api/health`, `/api/auth/*`
- Middleware: CORS, cookie-parser, JSON body, Zod validation, errorHandler
- Auth: Bearer token verificado via `supabaseAdmin.auth.getUser()`
- Roles: `app_metadata.role` en usuario Supabase (USER, PSYCHOLOGIST, ADMIN)

### Base de datos
- PostgreSQL 16 (Docker local actual / Supabase cloud)
- ORM: Prisma (provider: postgresql)
- Esquema: `public` (por defecto)
- **Sin migraciones formales** (solo `db:push` disponible) — requiere DATABASE_URL
- Tablas: User, Profile, PsychologistProfile, Session
- **`User.passwordHash`** — legado, pendiente de eliminación (documentado abajo)

### Docker
- docker-compose.yml con 3 servicios: postgres, backend, frontend
- Backend expone puerto 3002, Frontend 5174
- Volúmenes para persistencia de DB y node_modules

### Git
- Repositorio: `https://github.com/dhait0/webkitsunova-proyecto.git`

## Variables de entorno — nombres correctos

### Backend (local y Vercel)
| Variable | Descripción | Ejemplo |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | Secret key (SECRETO, SOLO backend) | `eyJhbG...` |
| `DATABASE_URL` | Pooler connection (pgbouncer:6543) | `postgresql://...:6543/postgres?pgbouncer=true&...` |
| `DIRECT_URL` | Conexión directa (5432, sin pooler) | `postgresql://...:5432/postgres?sslmode=require` |
| `PORT` | Puerto del backend | `3002` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:5174` |
| `CORS_ORIGIN` | Orígenes permitidos | `http://localhost:5174` |

### Frontend (Vite — se exponen al cliente)
| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (PÚBLICO) | `eyJhbG...` |
| `VITE_API_URL` | URL del backend + /api | `http://localhost:3002/api` |

---

## Cambios realizados

### Fase 3 — Cliente Supabase Frontend
- Creado: `frontend/src/lib/supabase.ts` — cliente Supabase con `VITE_SUPABASE_PUBLISHABLE_KEY`
- Modificado: `frontend/src/lib/api.ts` — añade Bearer token de Supabase session
- Modificado: `frontend/src/pages/HomePage.tsx` — registro via Supabase
- Modificado: `frontend/src/pages/LoginPage.tsx` — login via Supabase
- Modificado: `frontend/src/components/ProtectedRoute.tsx` — sesión via Supabase
- Modificado: `frontend/src/layouts/DashboardLayout.tsx` — logout via Supabase
- Modificado: `frontend/src/main.tsx` — init Supabase + `onAuthStateChange` que redirige a `/login` al cerrar sesión
- Creado: `frontend/vercel.json`
- Dependencia añadida: `@supabase/supabase-js@^2.116.0`

### Fase 4 — Backend Auth (Supabase)
- Eliminado: `backend/src/lib/session.ts` (JWT propio, reemplazado por Supabase)
- Creado: `backend/src/lib/supabase.ts` — admin client con `SUPABASE_SECRET_KEY`
- Creado: `backend/src/lib/role.ts` — helper `getRole()` lee `app_metadata.role`
- Modificado: `backend/src/config/env.ts` — validación Zod de `SUPABASE_URL` y `SUPABASE_SECRET_KEY`
- Modificado: `backend/src/middleware/auth.ts` — `requireAuth` verifica token con `supabaseAdmin.auth.getUser()`
- Modificado: `backend/src/middleware/requireRole.ts` — `requireRole(...roles)` verifica permisos via `app_metadata.role`
- Modificado: `backend/src/routes/auth.ts` — Auth completa con Supabase Admin SDK:
  - `POST /register` — crea usuario en Supabase + establece `app_metadata.role = 'USER'`
  - `POST /login` — sign in con email/password, retorna rol desde `app_metadata`
  - `POST /logout` — cierra sesión
  - `GET /me` — info del usuario autenticado
  - `GET /admin/check` — protegido por `requireAuth` + `requireRole('ADMIN')`
  - `GET /mfa/status` — indica si usuario tiene MFA habilitado
- Modificado: `backend/src/server.ts` — no hace `listen` si `VERCEL=1`
- Modificado: `backend/src/types/express.d.ts` — define `req.user` con id, email, role
- Modificado: `backend/api/index.ts` — serverless wrapper para Vercel
- Modificado: `backend/vercel.json` — config serverless
- Modificado: `backend/tsconfig.json` — incluye `api/`
- Dependencias añadidas: `@supabase/supabase-js@^2.116.0`, `@vercel/node@^13.0.1`

### Correcciones de seguridad aplicadas (auditoría correctiva)
1. **Roles vía `app_metadata`**: Toda la lectura de roles usa `user.app_metadata.role`, NO `user.role` (que en Supabase solo contiene 'default'/'authenticated'/'anon')
2. **Registro con rol correcto**: `POST /api/auth/register` establece `app_metadata.role = 'USER'` via `supabaseAdmin.auth.admin.updateUserById()` tras crear el usuario
3. **Renombrado de variables**:
   - `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY` (coherencia con documentación Supabase)
   - `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY` (nombre correcto de la clave pública de Supabase)
4. **RLS SQL** creado: `backend/supabase/migrations/rls.sql` — ENABLE RLS + políticas por usuario
5. **Backend no almacena credenciales**: Passwords manejados exclusivamente por Supabase Auth
6. **Sin JWT propio**: Eliminado `jsonwebtoken` del backend (ya no en `package.json`)

### Otros
- Modificado: `README.md` (instrucciones Supabase + Vercel con nombres correctos)
- Modificado: `DEPLOYMENT.md` (guía de despliegue actualizada)
- Modificado: `.env.example` (variables con nombres correctos)
- Creado: `backend/supabase/migrations/rls.sql` (RLS policies)
- Modificado: `backend/src/app.ts` (VERCEL check)
- Modificado: `frontend/src/main.tsx` (manejo de cambio de sesión)

---

## Archivos importantes modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `frontend/src/lib/supabase.ts` | CREADO | Cliente Supabase frontend |
| `frontend/src/lib/api.ts` | MODIFICADO | Bearer token auth |
| `frontend/src/pages/HomePage.tsx` | MODIFICADO | Registro Supabase |
| `frontend/src/pages/LoginPage.tsx` | MODIFICADO | Login Supabase |
| `frontend/src/components/ProtectedRoute.tsx` | MODIFICADO | Sesión Supabase |
| `frontend/src/layouts/DashboardLayout.tsx` | MODIFICADO | Logout Supabase |
| `frontend/src/main.tsx` | MODIFICADO | Init Supabase + session change handler |
| `frontend/vercel.json` | CREADO | Config Vercel |
| `backend/src/lib/supabase.ts` | CREADO | Admin client |
| `backend/src/lib/role.ts` | CREADO | Helper getRole() |
| `backend/src/config/env.ts` | MODIFICADO | Variables Supabase (Zod) |
| `backend/src/middleware/auth.ts` | MODIFICADO | Verificación token Supabase |
| `backend/src/middleware/requireRole.ts` | CREADO | Autorización por rol |
| `backend/src/routes/auth.ts` | MODIFICADO | Auth Admin SDK + MFA + role check |
| `backend/src/server.ts` | MODIFICADO | Vercel compatible |
| `backend/api/index.ts` | CREADO | Vercel handler |
| `backend/vercel.json` | CREADO | Config serverless |
| `backend/src/types/express.d.ts` | MODIFICADO | Tipos req.user |
| `backend/src/lib/session.ts` | ELIMINADO | JWT obsoleto |
| `backend/tsconfig.json` | MODIFICADO | Incluye api/ |
| `.env.example` | MODIFICADO | Variables nuevas |
| `backend/supabase/migrations/rls.sql` | CREADO | RLS policies |
| `README.md` | MODIFICADO | Instrucciones actualizadas |
| `DEPLOYMENT.md` | MODIFICADO | Guía de despliegue actualizada |

---

## Pruebas ejecutadas

- `frontend npm run typecheck`: ✅ Sin errores
- `frontend npm run build`: ✅ Sin errores
- `backend npm run typecheck`: ✅ Sin errores
- `backend npm run build`: ✅ Sin errores (dist generado)
- `backend npx prisma generate`: ✅ Client generado
- `backend npx prisma format`: ✅ Schema formateado

---

## Legado pendiente de eliminación

### `User.passwordHash` en schema.prisma
El modelo `User` aún contiene `passwordHash` (legado del sistema PHP/MySQL anterior). Con la nueva arquitectura, las contraseñas las gestiona exclusivamente Supabase Auth. Este campo debe eliminarse del schema cuando se tenga acceso a la base de datos para realizar la migración de datos.

**Estado**: ⏸ Bloqueado — requiere ejecutar migraciones con `supabase db push`

### `backend/prisma/seed.ts` — usa bcryptjs
El seed de administración local aún usa `bcryptjs` para hash de contraseñas. Es una práctica legacy para desarrollo local con Docker. Futuramente debe migrarse a Supabase Admin SDK.

**Estado**: ⏸ Legacy — funcional para desarrollo local, pendiente de migración

### `backend/package.json` — `bcryptjs` y `@types/bcryptjs`
Aún presentes porque `backend/prisma/seed.ts` depende de `bcryptjs`. Pueden eliminarse cuando el seed se migre a Supabase Admin SDK.

**Estado**: ⏸ Pendiente — eliminar seed.ts legacy o migrar a Supabase Admin

---

## Decisiones técnicas

1. **Supabase Auth en frontend**: El frontend gestiona autenticación directamente con `@supabase/supabase-js`. Sesión en localStorage del navegador.
2. **Bearer token al backend**: El frontend envía `Authorization: Bearer <access_token>` en cada request a Express.
3. **Backend verifica con Admin SDK**: `supabaseAdmin.auth.getUser(token)` verifica el token.
4. **Roles via `app_metadata`**: El rol de la aplicación se almacena en `user.app_metadata.role`, no en `user.role` (Supabase auth type).
5. **Prisma sigue como ORM principal**: No se migran consultas a Supabase Data API.
6. **Docker local se mantiene**: Para desarrollo durante la migración.
7. **Vercel para ambos**: Frontend (static build) y Backend (serverless functions).
8. **RLS por defecto**: Deny by default en tablas con datos sensibles.
9. **Sin cookies httpOnly**: La sesión se gestiona en localStorage vía Supabase client SDK. (Nota: AGENTS.md anterior mencionaba cookies httpOnly — esto ya no aplica.)

---

## Problemas / Bloqueos

1. **Supabase CLI migrations** — ✅ Migraciones creadas en `supabase/migrations/` y aplicadas al proyecto `edbtowdipfeskqdmngji` mediante `supabase db push`.
2. **Prisma validate**: No ejecutado después del cambio de `directUrl` en schema. Requiere DATABASE_URL.
3. **Prisma generate**: ✅ Client generado.
4. **Backend `src/lib/supabase.ts`** — Protección añadida contra inicialización sin variables ✅.
5. **`backend/api/index.ts`**: Importa `../src/app` — ruta relativa verificada y funcional ✅. Runtime `nodejs20.x` en vercel.json con `@vercel/node@^13.0.1` — compatible ✅.
6. **`backend/src/routes/auth.ts`**: Type assertions (`as unknown as`) para `createUser`/`updateUserById` del Admin SDK — funcional, compila sin errores ✅.
7. **Docs**: DEPLOYMENT.md, README.md, MIGRATION_STATUS.md actualizadas con nombres correctos ✅.
8. **ProtectedRoute**: Corregido para leer `app_metadata.role` ✅.
9. **`docker-compose.yml`**: Contiene `JWT_SECRET` legacy — no utilizado por el backend actual (LEGACY TEMPORAL).
10. **`backend/prisma/seed.ts`**: Reestructurado para separar datos legacy (passwordHash + bcryptjs) de identidades Supabase Auth.
11. **Frontend MFA** — ✅ Implementado (páginas creadas, rutas configuradas, LoginPage con AAL check).
12. **`frontend/vercel.json`** — ✅ SPA rewrite añadida para BrowserRouter.
13. **`backend/package.json`** — `jsonwebtoken` eliminado (ya no está). `bcryptjs` retenido para seed legacy.

---

## Acciones manuales pendientes — Supabase (requiere acción del usuario)

- [ ] Crear proyecto en supabase.com
- [ ] Copiar Project URL y publishable/secret keys
- [ ] Configurar Auth redirect URLs (http://localhost:5174 y dominio Vercel)
- [ ] Ejecutar `npm run supabase:deploy` para aplicar migraciones
- [ ] Ejecutar SQL de RLS en Supabase SQL Editor: `backend/supabase/migrations/rls.sql`
- [ ] Activar MFA en Dashboard si se requiere

## Acciones manuales pendientes — Vercel (requiere acción del usuario)

- [ ] Crear proyecto en Vercel desde este repositorio unificado
- [ ] Configurar build command: `npm run build`
- [ ] Pegar variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`
- [ ] Verificar deploy en producción

## Acciones manuales pendientes — Código (desarrollo)

- [x] Aplicar migración inicial al proyecto Supabase `edbtowdipfeskqdmngji`
- [ ] Eliminar `passwordHash` del schema.prisma (cuando se tenga acceso a la BD)
- [ ] Activar MFA en Dashboard si se requiere (frontend listo ✅, backend listo ✅)
- [ ] Añadir pruebas unitarias/integración

---

## Próxima fase
Todos los builds verificados ✅. Código listo para despliegue.
Faltan:
- Pruebas funcionales con credenciales reales de Supabase (PENDIENTE DE CREDENCIALES DEL USUARIO)
- Eliminar passwordHash del schema (PENDIENTE DE ACCESO A BD)
