# WebKitsunova Proyecto

Monorepo base para reconstruir Kitsunova con:

- `frontend`: React + TypeScript + Vite
- `backend`: Express + TypeScript + Prisma
- `postgres`: PostgreSQL para persistencia
- `docker-compose.yml`: entorno local con recarga automática del frontend
- `Jenkinsfile`: pipeline base de CI/CD

## Arranque local

1. Copia `.env.example` a `.env` y ajusta secretos si hace falta.
2. Ejecuta:

```bash
docker compose up --build
```

3. Abre:

- Frontend: http://localhost:5174
- Backend: http://localhost:3002/api/health

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

Variables opcionales para el seed:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_FIRST_NAME`
- `SEED_ADMIN_LAST_NAME`

## Comportamiento del frontend

El servicio de frontend corre con `vite` en modo desarrollo dentro de Docker, con volumen montado sobre el código fuente. Eso hace que cada cambio en `frontend/` se reconstruya y refresque automáticamente.

## Registro público

El formulario público de registro crea cuentas de usuario normales. Los perfiles de psicólogo deben darse de alta por un flujo administrativo separado.

## Siguiente paso recomendado

Conectar el frontend a los endpoints reales del backend y migrar el modelo de datos existente de PHP/MySQL a Prisma/PostgreSQL.
