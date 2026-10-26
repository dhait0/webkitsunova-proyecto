# PLAN — Unificación a Next.js (App Router)

## Propósito

Este documento es la propuesta revisada para abandonar `frontend/` (Vite SPA) y
`backend/` (Express) y consolidating el proyecto en una única aplicación Next.js
con un único `package.json`, un único pipeline y un único proyecto de Vercel.

`AGENTS.md` §5–§7 define esa arquitectura objetivo. Este documento concrete
qué se mueve, qué se reescribe, qué se descarta y en qué orden.

> La propuesta existía solo como conversación. Este archivo es su versión
> durable y corregida, construida contra el inventario real del repositorio.

---

## 1. Inventario actual (verificado en `staging` @ `7e5d892`)

No existe `package.json` en la raíz. Hay dos paquetes independientes.

### 1.1 Frontend — `frontend/`

| Dato | Valor |
|---|---|
| Archivos fuente | 106 (`.ts`/`.tsx`) |
| LOC fuente | ~11.900 |
| Stack | React 18.3, Vite 5.4, TypeScript 5.6, React Router 6.26 |
| Estilos | CSS vanilla, 3 hojas: `tailwind.css`, `global.css`, `landing.css` |
| Animación | framer-motion |
| Auth | `@supabase/supabase-js`, sesión en **localStorage** |
| Tests | 125 (`src/**/*.test.{ts,tsx}`, jsdom) |
| Rutas | 5 grupos: `/`, `/login`, `/mfa/*`, `/dashboard/*`, `/psy/*`, `/admin/*` |
| Huellas | `inspect.js` … `inspect5.js`, `screenshot.js` (scripts de depuración, 8 en total) |

### 1.2 Backend — `backend/`

| Dato | Valor |
|---|---|
| Archivos fuente | 29 (`.ts`) |
| LOC fuente | ~4.058 |
| Stack | Node + Express 4.21, TypeScript 5.6, ESM, Zod |
| Endpoints | **61** (`auth` 8, `admin` 12, `psy` 40, `health` 1) |
| ORM | Prisma 5.20, PostgreSQL/Supabase |
| Tests | 73 (`tests/**/*.test.ts`, node, supertest) |
| Migraciones | 2 (`1726592000000_init`, `20260930010000_psy_module`) |

Desglose del backend:

| Archivo | LOC | Natureza |
|---|---|---|
| `src/services/psy/*.ts` (9) | 1.902 | **Agnóstico del framework** → se mueve verbatim |
| `src/routes/psy.ts` | 771 | Enrutado Express → se reescribe |
| `src/routes/admin.ts` | 580 | Enrutado Express → se reescribe |
| `src/routes/auth.ts` | 216 | Enrutado Express → se reescribe |
| `src/middleware/*.ts` (4) | 161 | Middleware Express → se reescribe |
| `src/lib/*.ts` (3) | 62 | Prisma, Supabase admin, roles → se mueve |
| `src/config/env.ts` | 15 | Validación Zod → se mueve |
| `src/server.ts`, `api/index.ts` | ~30 | Bootstrap Express → se elimina |

### 1.3 Despliegue e infraestructura (estado inconsistente)

| Archivo | Problema |
|---|---|
| `vercel.json` (raíz) | Build `@vercel/node` sobre `backend/src/server.ts` sirviendo el `dist` de Vite como estático. **No es Next.js.** |
| `frontend/vercel.json`, `backend/vercel.json` | Config de SPA y serverless por separado → contradice "1 proyecto" |
| `.github/workflows/pr-checks.yml` | 6 jobs × 2 `working-directory`; `paths` filtrando `backend/**` + `frontend/**` |
| `.github/workflows/deploy-migrations.yml` | `node-version: 20`, `cache-dependency-path: backend/package-lock.json`, paths `backend/prisma/**` |
| `docker-compose.yml` | 3 servicios (postgres, backend, frontend); inyecta `JWT_SECRET` legacy no usado |
| `Jenkinsfile` | Jenkins como pipeline principal, contradice `AGENTS.md` §12 |
| Versión de Node | El commit `dc84596` exige Node 22+, pero **los 3 workflows siguen en Node 20** y ningún `package.json` tiene `engines` |

---

## 2. Revisión de la propuesta original

La propuesta seivrificó en cinco puntos. **Tres son correctos, dos estaban mal.**

### 2.1 Correcto: los route groups absorben el árbol de rutas

`app/(public)/`, `app/(auth)/`, `app/user/`, `app/psychologist/`, `app/admin/`
mapean 1:1 con los grupos de `App.tsx:42-118`. Sin invención de rutas.

### 2.2 Correcto: `services/psy/*` se mueve sin tocar

Las nueve funciones de servicio reciben datos y devuelven datos; no conocen
Express ni Prisma más allá del cliente importado. 1.902 LOC sin cambios.

### 2.3 Correcto: `prisma/` sube a la raíz

`AGENTS.md` §10 lo pide y `deploy-migrations.yml` se ajusta a `prisma/**`.

### 2.4 **Incorrecto: «middleware.ts absorbe la verificación de sesión»**

Ese punto no es implementable tal como estaba escrito. Dos razones:

1. `middleware.ts` se ejecuta en el **runtime Edge**, que no admite el cliente
   Node de Supabase ni Prisma.
2. Hoy la sesión vive en **localStorage**. No hay cookie. El middleware no tiene
   nada que leer.

Corrección — la protección se reparte en tres capas, no en una:

| Capa | Responsabilidad | Runtime |
|---|---|---|
| `middleware.ts` | Redirección optimista + filtro grueso de rol leyendo *claims* del JWT | Edge |
| `lib/auth/guard.ts` | Verificación real de sesión y rol | Node |
| `app/*/layout.tsx` | Invoca el guard y provee la sesión al árbol | Node (server components) |

El guard es la **única** frontera de autorización real. El middleware es una
optimización de UX, no un control de seguridad: nunca se confie en él para
autorizar.

### 2.5 **Incorrecto: subestimaba el cambio de sesión**

La propuesta lo treatable como un movimiento de carpetas. Es el cambio de fondo
del proyecto, porque Route Handlers y server components no ven localStorage.

| | Hoy | Después |
|---|---|---|
| Almacén | localStorage | Cookies (`@supabase/ssr`) |
| Envío de credencial | `Authorization: Bearer <token>` | `credentials: 'include'`, mismo origen |
| Origen del API | `VITE_API_URL` (otro host) | Relativo, mismo origen |
| Verificación | `getUser(token)` por request | `getUser()` por cookie + refresh en middleware |
| Vars públicas | `VITE_*` | `NEXT_PUBLIC_*` |

Sin este cambio, `app/api/**` y los server components son **inútiles**: no
pueden autenticarse. Por eso es la Fase 1 y no un detalle de la Fase 4.

---

## 3. Estructura objetivo

```text
/
├── app/
│   ├── layout.tsx                    # raíz: styles, metadata, Toaster
│   ├── (public)/
│   │   ├── page.tsx                  # /            ← HomePage.tsx
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx            # /login       ← LoginPage.tsx
│   │   └── mfa/
│   │       ├── verify/page.tsx       # /mfa/verify
│   │       ├── enroll/page.tsx       # /mfa/enroll
│   │       └── settings/page.tsx     # /mfa/settings
│   ├── user/                         # /dashboard/*
│   │   ├── layout.tsx                # ← DashboardLayout + guard(USER)
│   │   ├── page.tsx
│   │   ├── habitos/page.tsx
│   │   ├── chats/page.tsx
│   │   ├── citas/page.tsx
│   │   └── psicologos/page.tsx
│   ├── psychologist/                 # /psy/*
│   │   ├── layout.tsx                # ← PsyLayout + guard(PSYCHOLOGIST)
│   │   ├── page.tsx
│   │   ├── sesiones/{page, hoy/page}.tsx
│   │   ├── pacientes/page.tsx
│   │   ├── pacientes/[userId]/page.tsx
│   │   ├── talleres/page.tsx
│   │   ├── talleres/[id]/page.tsx
│   │   ├── talleres/[id]/inscriptos/page.tsx
│   │   ├── recursos/page.tsx
│   │   ├── recursos/[id]/page.tsx
│   │   ├── mensajes/page.tsx
│   │   ├── mensajes/[conversationId]/page.tsx
│   │   ├── notificaciones/page.tsx
│   │   ├── derivaciones/page.tsx
│   │   ├── perfil/page.tsx
│   │   └── configuracion/{page.tsx, notificaciones/page.tsx}
│   ├── admin/                        # /admin/*
│   │   ├── layout.tsx                # ← AdminLayout + guard(ADMIN)
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── psychologists/page.tsx
│   │   └── [...notFound]/page.tsx    # AdminNotFoundPage
│   └── api/
│       ├── health/route.ts
│       ├── auth/{register,login,logout,me,admin/check,mfa/status,mfa/unenroll,google}/route.ts
│       ├── admin/…   12 route.ts
│       └── psy/…     40 route.ts
├── lib/
│   ├── auth/{server.ts,guard.ts,roles.ts}
│   ├── db/prisma.ts
│   ├── supabase/{server.ts,admin.ts}
│   ├── validation/env.ts
│   ├── http/{json.ts,errors.ts}     # adaptadores de errorHandler
│   └── api-client.ts                 # ← frontend/src/lib/api.ts
├── components/                       # movido desde frontend/src/components
├── features/                         # ← frontend/src/pages/* por dominio
├── services/psy/                     # movido verbatim desde backend/src
├── prisma/{schema.prisma,seed.ts,migrations/}
├── tests/
│   ├── app/api/**/*.test.ts          # ex supertest
│   ├── lib/**/*.test.ts
│   └── components/**/*.test.tsx
├── public/brand/                     # ← frontend/public/brand
├── middleware.ts
├── next.config.ts
├── vitest.config.ts                  # node + jsdom (environmentMatchGlobs)
├── package.json                      # UNIFICADO
├── Dockerfile
└── docker-compose.yml                # postgres + app
```

Sin carpeta `frontend/` ni `backend/`.

---

## 4. Fases

Cada fase termina con `typecheck` + `test` + `build` en verde y es commiteable.

### Fase 1 — Andamiaje y sesión por cookies
1. `package.json` unificado (merge de ambas dependencias), `engines: node >= 22`
2. Instalar `next`, `react@19`, `@supabase/ssr`; `tsconfig.json` único
3. `lib/db/prisma.ts`, `lib/supabase/*`, `lib/validation/env.ts`
4. **`lib/auth/server.ts`** — clientes Supabase con cookies (server) y navegador
5. **`middleware.ts`** — refresh de sesión + redirección optimista de rol
6. `lib/auth/guard.ts` — verificación real (Node)
7. `next.config.ts`, `vitest.config.ts`

Cierra con: login y logout funcionando con cookies, sin aún mover páginas.

### Fase 2 — Dominio público
`HomePage.tsx` → `app/(public)/page.tsx`. `PublicHeader`, `PublicFooter`,
`components/landing/*`, `styles/*`, `content/siteContent.ts`.
Las tres hojas CSS se importan desde `app/layout.tsx`.

### Fase 3 — Autenticación y MFA
`LoginPage`, `MfaVerifyPage`, `MfaEnrollPage`, `MfaSettingsPage`,
`components/landing/AuthUnified`. Los guards pasan a los layouts.

**Se eliminan** `ProtectedRoute.tsx`, `AdminRoute.tsx`, `PsyRoute.tsx` y sus
tests; su cobertura pasa a `lib/auth/guard.test.ts` + tests de middleware.

### Fase 4 — Route Handlers: `health` + `auth` (9)
Los controladores se conservan; cambia el contrato de entrada/salida:
`req.params` → `(await context.params).x` · `req.body` → `await request.json()`
`res.status().json()` → `NextResponse.json(body, { status })` ·
`next(err)` → `throw` hacia `lib/http/errors.ts`.

### Fase 5 — Route Handlers: `admin` (12) + `psy` (40)
`services/psy/*` se mueve **sin tocar**; los 40 handlers son cableado delgado.
`middleware/auth.ts`, `requireRole.ts`, `requireApprovedPsychologist.ts` y
`errorHandler.ts` se reescriben como funciones puras sobre `NextRequest`.

### Fase 6 — Superficies autenticadas
`user/` (5 páginas), `psychologist/` (17), `admin/` (4). Los layouts replacing
`DashboardLayout`, `PsyLayout` y `AdminLayout` invocan el guard y passent la
sesión por contexto de React.

`useParams` desaparece en favor de `params` como prop.

### Fase 7 — Tests
- `backend/tests/routes/*.test.ts` → unitarios sobre los handlers (sin HTTP server)
- `backend/tests/middleware/*` → unitarios sobre las funciones de guard
- `frontend/src/**/*.test.{ts,tsx}` → se mueven con sus archivos
- `vitest.config.ts` único con `environmentMatchGlobs` (node para API, jsdom para componentes)

### Fase 8 — Infraestructura y limpieza
- Borrar `vercel.json` raíz, `frontend/vercel.json`, `backend/vercel.json`
- `Dockerfile` único, `docker-compose.yml` a 2 servicios, sin `JWT_SECRET`
- `pr-checks.yml`: 6 jobs → 1; `deploy-migrations.yml` → `prisma/**`, Node 22
- Borrar `Jenkinsfile` (`AGENTS.md` §12)
- `.env.example`: `VITE_*` → `NEXT_PUBLIC_*`; quitar `CORS_ORIGIN`/`FRONTEND_URL`
- **Borrar** `frontend/inspect*.js`, `frontend/screenshot.js`
- `rm -rf frontend backend`
- Actualizar `README.md`, `DEPLOYMENT.md`, `docs/AUTH.md`, `docs/DEVELOPMENT.md`,
  `docs/DEPLOYMENT.md`, `docs/PROJECT_MEMORY.md`, `MIGRATION_STATUS.md`

### Fase 9 — Verificación
`typecheck` · `lint` · `test` (backend + frontend) · `build` · arranque real con
`docker compose up` y humo contra PostgreSQL.

---

## 5. Riesgos declarados

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La landing se reconsidera dentro del nuevo enrutador | Trabajo de diseño rehecho | El markup de `HomePage` se mueve sin reescribir; CSS intacto |
| 61 endpoints reescritos de forma mecánica | Regresiones silenciosas | Los tipos de `lib/api-client.ts` no cambian: si el cliente compila, el contrato se sostiene |
| Cambiar a cookies rompe el login en sesiones abiertas | Usuarios cierran sesión | Cambiar en una entrega, no desplegar a medias |
| `bcryptjs` y `passwordHash` heredados | Se arrastran al nuevo paquete | Fuera de alcance de esta migración; tratar aparte |
| Next 15 entrega `params` como Promise | Errores de tipos en 4 páginas dinámicas | Verificar con `tsc` en Fase 6, no en runtime |
| Perder los 198 tests en el camino | Cobertura a cero hasta la Fase 7 | Fases 4–5 mueven los tests de backend junto a los handlers |

## 6. Fuera de alcance

- Eliminar `User.passwordHash` y migrar `seed.ts` fuera de `bcryptjs`
- RLS de Supabase y sus políticas
- Completar las superficies de usuario (`habitos`, `citas`, `psicologos`) — hoy son
 *cáscaras* sin endpoints
- Rediseño visual, incluidos los hallazgos de drift en `global.css`
- El modelo de negocio de `PRODUCT.md` sin definir

---

## 7. Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Línea de Next.js | **Next.js 16 + React 19.3** | Es la versión estable actual. En un portafolio, usar lo actual pesa más que minimizar fricción. |
| Server Components | **Total: las 26 páginas reescritas** | Máximo beneficio de Next.js. Obliga a rediseñar la capa de datos (§8). |
| Git | Rama local `nextjs-unificacion`, merge a `staging` al final | Regla de `AGENTS.md` §14: nada de push ni PR automático |
| Route groups de `AGENTS.md` §7 | Sin desviación | Aquí el enrutador **sí** es Next.js, así que la estructura deja de ser makeup |
| `services/` en la raíz, no en `lib/` | Aceptado | Es lógica de negocio, no utilidades; mantiene la frontera de `AGENTS.md` §9 |
| Una sola suite de tests | Aceptado | Un `vitest.config.ts` con `environmentMatchGlobs` cubre ambos entornos |

---

## 8. Consecuencia de la decisión «todo Server Component»

Esta decisión **cambia el alcance del proyecto** y conviene dejarlo escrito antes de
empezar, porque no es lo que la propuesta original suponía.

Los 61 endpoints de Express existen por una sola razón: el frontend era una SPA
separada y la única forma de alcanzar `services/` era por HTTP. La capa de API es
un puente que desaparece cuando ambos lados viven en el mismo proceso.

Con todas las páginas como Server Components, el acceso a datos real queda así:

```text
Server Component  ──llamada directa──▶  services/  ──▶  Prisma
Form (client)     ──Server Action──────▶  services/  ──▶  Prisma
```

No hay `fetch`, ni serialización JSON, ni `Authorization` header por request.

### Qué desaparece

- `frontend/src/lib/api.ts` — **719 LOC** de clientes tipados. Se elimina.
- `routes/psy.ts` (771), `routes/admin.ts` (580), `routes/auth.ts` (216),
  `routes/health.ts` (13) — **1.580 LOC** de cableado Express. Se eliminan.
- Los 4 middlewares de Express (161 LOC) — reescritos como guards.
- `backend/api/index.ts`, `backend/src/server.ts`, `backend/src/app.ts` —
  el bootstrap de Express desaparece entero.

### Qué sobrevive

| Capa | LOC | Cambio |
|---|---|---|
| `services/psy/*.ts` (9) | 1.902 | **Ninguno** — se llama igual, sin HTTP |
| `lib/db/prisma.ts`, `lib/supabase/*` | ~90 | Rutas de import |
| `prisma/` | — | Sube a la raíz |
| `components/`, `features/`, `content/`, `styles/` | ~5.800 | Se mueven |
| `lib/auth/guard.ts` | nuevo | Reemplaza los 3 componentes de guarda |

Total **eliminable: ~2.460 LOC**. No es solo una reorganización: es una
simplificación real, que es el argumento a favor de hacerla.

### Qué se necesita que no existe

Las 26 páginas reescritas necesitan infraestructura que el proyecto no tiene:

1. **Server Actions** — no hay ninguna. Hay que crearlas por mutación
   (crear taller, actualizar paciente, suspender usuario, enviar mensaje…).
2. **Invalidación de caché y revalidación** — las páginas de listado necesitan
   `revalidatePath` / `revalidateTag` tras cada mutación.
3. **Errores de mutación** — patrón único de error de servidor → formulario.
   `errorHandler.ts` no cubre esto.
4. **Toasts de éxito desde Server Actions** — `AdminToaster` es un sistema de
   estado en cliente; hay que reconciliarlo con el retorno de las acciones.

### Route Handlers: qué queda

Solo lo que un cliente **externo** necesite. Hoy ninguno: la landing pública es
estática y no consume API. `register`, `login`, `logout`, `mfa/*`, `admin/check`
se invocan por el cliente de Supabase, no por HTTP propio.

**Por tanto `app/api/**` probablemente no exista en el estado final.** Se crea
solo si aparece un consumidor real. Esto es una inversión grande de la premisa
«61 endpoints → Route Handlers» de la propuesta original.

### Revisión del alcance por fase

| Fase de §4 | Sigue vigente |
|---|---|
| 1 — Andamiaje y cookies | Sí, intacta |
| 2 — Dominio público | Sí, intacta |
| 3 — Auth y MFA | Sí, intacta |
| 4 — Route Handlers | **Reemplazada**: Server Actions + guards |
| 5 — Route Handlers | **Eliminada**: `services/` se mueve directo |
| 6 — Superficies autenticadas | **Ampliada**: reescritura RSC completa |
| 7 — Tests | **Ampliada**: los tests de supertest se reescriben sobre services |
| 8 — Infra y limpieza | Sí, más `DELETE app/api/**` si no hay consumidor |
| 9 — Verificación | Sí, intacta |

**El riesgo más alto de todo el plan pasa a ser la Fase 6**, que deja de ser
mover páginas y pasa a ser reescribir la capa de datos de 26 páginas.
