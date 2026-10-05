# WebKitsunova Proyecto

Aplicación full-stack unificada construida sobre Next.js 16 (App Router) y React 19. Un solo repositorio, un solo proceso, un solo despliegue.

- **App**: Next.js 16 App Router + React 19, Server Components y Server Actions
- **Datos**: PostgreSQL en Supabase, accedido con Prisma
- **Auth**: Supabase Auth mediante `@supabase/ssr` (cookies httpOnly, sin token en `localStorage`)
- **Estilos**: Tailwind CSS
- **Tests**: Vitest + Testing Library
- **Despliegue**: Vercel (el proyecto Next.js se despliega tal cual)
- **Local**: `docker compose` con Postgres y hot reload

Ya no existen `frontend/` ni `backend/`. No los busques.

## Requisitos

- Node.js `>=22` (obligatorio: el runtime de Vercel y las imágenes Docker usan Node 22)

## Arranque local (Supabase + npm)

1. Copia `.env.example` a `.env` y rellena tus claves de Supabase.
2. Instala dependencias y genera el cliente de Prisma:

```bash
npm install
npx prisma generate
```

 3. Aplica las migraciones:

 ```bash
 npm run supabase:deploy
 ```

 4. Arranca:

```bash
npm run dev
```

Abre http://localhost:3000.

## Arranque local (Docker)

```bash
docker compose up --build
```

Abre http://localhost:3000.

Para hot reload contra el Postgres del compose:

```bash
docker compose --profile dev up --build
```

## Variables de entorno

 | Variable | Expuesta al navegador | Para qué sirve |
 | --- | --- | --- |
 | `NEXT_PUBLIC_SUPABASE_URL` | sí | URL del proyecto Supabase |
 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sí | Clave `publishable` del cliente |
 | `SUPABASE_URL` | no | Misma URL, para el runtime de Node |
 | `SUPABASE_SECRET_KEY` | no | Operaciones administrativas. Solo servidor |
 | `DATABASE_URL` | no | Pooler de Postgres (puerto 6543) |

 `DATABASE_URL` debe apuntar al **Transaction pooler**: las conexiones directas agotan el límite de clientes de PostgreSQL en un entorno serverless. Detalle en `.env.example`.

## Validación

```bash
npm run typecheck
npm run test
npm run build
```

Los tres comandos deben pasar antes de abrir un Pull Request. En local hacen falta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` y `DATABASE_URL` válidos para que `next build` termine.

## Autenticación y rutas

- `proxy.ts` (antes `middleware.ts`) hace solo una redirección optimista en Edge: lee el rol de la sesión sin revalidarlo.
- La autorización real vive en `lib/auth/guard.ts`, que corre en Node y llama a `supabase.auth.getUser()`.
- `app/(user)/layout.tsx`, `app/(psychologist)/layout.tsx` y `app/(admin)/layout.tsx` ejecutan el guard real antes de renderizar.

| Área | Prefijo | Roles admitidos |
| --- | --- | --- |
| Público | `/` | todos |
| Autenticación | `/login`, `/mfa/*` | todos |
| Usuario | `/dashboard/*` | USER |
| Psicólogo | `/psy/*` | PSYCHOLOGIST, ADMIN |
| Administración | `/admin/*` | ADMIN |

Los grupos entre paréntesis existen para mantener los nombres de carpeta de `agents.md` sin alterar las URLs públicas.

 ## Migraciones

 ```bash
 npm run supabase:deploy      # aplicar migraciones a producción
 ```

 Las migraciones residen en `supabase/migrations/` y se versionan con Supabase CLI.

 Nunca uses `prisma db push` contra producción.

## Registro público

El formulario público de registro crea cuentas de usuario normales vía Supabase Auth. Los perfiles de psicólogo se dan de alta por un flujo administrativo separado.

## MFA (autenticación de dos factores)

- `/mfa/enroll`: activar MFA escaneando un QR
- `/mfa/verify`: verificar el código al iniciar sesión
- `/mfa/settings`: gestionar MFA (activar o desactivar)

## Documentación

- `docs/DEVELOPMENT.md`: flujo de trabajo local
- `docs/AUTH.md`: sesiones, roles y guards
- `docs/DEPLOYMENT.md`: Vercel, migraciones y CI/CD
- `docs/PROJECT_MEMORY.md`: conocimiento técnico acumulado del proyecto
