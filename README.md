# WebKitsunova Proyecto

Monorepo base para reconstruir Kitsunova con:

- `frontend`: React + TypeScript + Vite
- `backend`: Express + TypeScript + Prisma
- `supabase`: PostgreSQL + Auth
- `vercel`: despliegue
- `docker-compose.yml`: entorno local con recarga automática del frontend
- `Jenkinsfile`: pipeline base de CI/CD

## Arranque local (Docker)

1. Copia `.env.example` a `.env` y ajusta secretos si hace falta.
2. Ejecuta:

```bash
docker compose up --build
```

3. Abre:

- Frontend: http://localhost:5174
- Backend: http://localhost:3002/api/health

## Arranque local (Supabase + Vercel)

1. Crea un proyecto en [supabase.com](https://supabase.com) y anota:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (secreto)
2. Configura las variables de entorno en tu PC:

```bash
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SECRET_KEY="eyJhbG..."
export VITE_SUPABASE_URL="https://xxxxx.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbG..."
```

3. Sincroniza la base de datos:

```bash
cd backend
npm run db:push
```

4. Despliega en Vercel:

```bash
cd frontend && npx vercel --prod
cd ../backend && npx vercel --prod
```

## Inicializar Prisma

Cuando el contenedor del backend esté arriba por primera vez, sincroniza el esquema:

```bash
docker compose exec backend npm run db:push
```

Si prefieres migraciones formales, usa:

```bash
docker compose exec backend npm run prisma:migrate -- --name init
```

Para crear o actualizar el usuario administrador de desarrollo:

```bash
docker compose exec backend npm run db:seed
```

## Registro público

El formulario público de registro crea cuentas de usuario normales via Supabase Auth. Los perfiles de psicólogo deben darse de alta por un flujo administrativo separado.

## MFA (Autenticación de dos factores)

El soporte MFA TOTP está implementado en el frontend:
- **/mfa/enroll**: Activar MFA (escanear QR)
- **/mfa/verify**: Verificar código al iniciar sesión
- **/mfa/settings**: Gestionar MFA (activar/desactivar)

Vea `MIGRATION_STATUS.md` para detalles técnicos.

## Seed

Para desarrollo local con Docker:
```bash
docker compose exec backend npm run db:seed
```

El seed crea un usuario admin con passwordHash LEGACY para desarrollo local. Para crear el administrador en producción, usa Supabase Auth directamente.

## Siguiente paso recomendado

Conectar el frontend a los endpoints reales del backend y migrar el modelo de datos existente de PHP/MySQL a Prisma/PostgreSQL.
