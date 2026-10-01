# Agents Guide - WebKitsunova

Este archivo describe cómo trabajar dentro de `webkitsunova_proyecto/`.

## Objetivo del proyecto

Reconstruir Kitsunova como una plataforma web moderna con:

- `frontend` en React + TypeScript
- `backend` en Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- contenedores Docker para desarrollo y despliegue
- CI/CD con Jenkins

## Estructura del repositorio

- `frontend/`: interfaz de usuario
- `backend/`: API, autenticación y lógica de negocio
- `docs/`: documentación funcional y técnica
- `docker-compose.yml`: entorno local completo
- `Jenkinsfile`: pipeline de integración y entrega continua

## Convenciones

- Usar TypeScript en frontend y backend.
- Mantener validación de entrada en servidor con `zod`.
- Mantener el estado de sesión en localStorage vía Supabase Auth (httpOnly cookies no aplican con esta arquitectura).
- Priorizar componentes reutilizables y rutas por dominio.
- Evitar mezclar lógica de negocio dentro de componentes de UI.
- **Seguir el Design System definido en `DESIGN_SYSTEM.md` (neumorfismo, variables CSS, breakpoints, animaciones Framer Motion).**

## Reglas de desarrollo

- No editar el proyecto legado salvo que el usuario lo pida explícitamente.
- No borrar archivos existentes sin confirmación.
- Cuando se agregue una nueva funcionalidad, documentar su intención y su impacto.
- Cualquier cambio en autenticación, roles o esquema de base de datos debe revisarse con especial cuidado.

## Backend

- Usar Prisma como fuente de verdad del esquema.
- Cualquier modelo nuevo debe reflejarse en `backend/prisma/schema.prisma`.
- La API debe responder con JSON consistente.
- Los errores de validación deben retornar `400`.
- Los errores de autenticación deben retornar `401` o `403` según corresponda.
- Los roles se leen de `user.app_metadata.role` (NO de `user.role` que es el tipo de auth de Supabase: 'default'/'authenticated'/'anon').

## Frontend

- Mantener separación entre páginas, componentes y servicios.
- Consumir la API a través de una capa centralizada.
- No duplicar llamadas `fetch` dispersas por toda la app.
- Usar rutas protegidas para áreas privadas.

## Docker y entorno local

- `docker compose up --build` debe levantar toda la pila.
- El frontend debe recargarse automáticamente al cambiar archivos.
- El backend debe reiniciarse en modo desarrollo cuando cambie el código.
- PostgreSQL debe persistir datos en un volumen.

## CI/CD

- `Jenkinsfile` debe validar instalación, tipado y build.
- Antes de desplegar, el pipeline debe pasar por `typecheck` y `build`.
- Cualquier etapa de deploy debe quedar parametrizada por variables de entorno.

## Antes de tocar código

1. Entender el flujo completo afectado.
2. Revisar si existe una ruta, modelo o componente reutilizable.
3. Mantener compatibilidad con el contrato de API si ya existe.
4. Actualizar documentación cuando el cambio altere el comportamiento.

## Siguientes pasos recomendados

- Implementar MFA frontend (enrollment, challenge, verify screens).
- Ejecutar migración Prisma formal (requiere DATABASE_URL de Supabase).
- Eliminar `passwordHash` del modelo User en schema.prisma (legacy).
- Definir modelos de hábitos, mensajes, talleres, foro y psicólogos.
- Crear layout base para `admin`, `user` y `psy`.
- Añadir pruebas y seed inicial para Prisma.** (parcialmente hecho)

## Seed de admin en Supabase Auth

El login se realiza vía `supabase.auth.signInWithPassword` (cliente). El usuario
admin debe existir en **Supabase Auth** con `app_metadata.role = 'ADMIN'`.

El seed de Prisma (`prisma/seed.ts`) solo crea el registro en PostgreSQL. Para
crear el usuario en Supabase Auth y sincronizar Prisma, ejecutar:

```sh
cd backend && npm run seed:auth
```

Lee las credenciales de `SEED_ADMIN_*` en `.env` y usa `supabaseAdmin.auth.admin`
para crear/actualizar el usuario con el rol correcto.

## Entorno de desarrollo local

El stack usa **Supabase Auth** (API en la nube) + **PostgreSQL local en Docker** para datos.

1. `docker compose up -d --build` levanta PostgreSQL (puerto 5433→5432), backend y frontend.
2. Para desarrollo con Vite/Express locales (no Docker), el backend
   se conecta a PostgreSQL en `localhost:5433`. Usa `backend/.env` con:
   ```
   DATABASE_URL=postgresql://webkitsunova:webkitsunova_dev@localhost:5433/webkitsunova
   ```
3. `CORS_ORIGIN` debe incluir el puerto del frontend local:
   ```
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174
   ```
4. Para crear tablas y sincronizar admin:
   ```sh
   npm run db:push        # crea las 19 tablas en PostgreSQL local
   npm run seed:auth      # crea admin en Supabase Auth + sincroniza en Prisma
   ```

## Notas de arquitectura de autenticación

- El rol se lee exclusivamente de `user.app_metadata.role` (nunca de
  `user.role` que es el tipo de Auth de Supabase: 'authenticated'/'anon').
- `requireAuth` (`src/middleware/auth.ts`) verifica el JWT y popula `req.user`.
- `requireRole` (`src/middleware/requireRole.ts`) **confía en `req.user.role`**
  establecido por `requireAuth`. No re-valida contra Supabase para evitar
  llamadas redundantas y el bug de pasar UUID en vez de JWT a `getUser()`.

## SQL de esquema para Supabase

Si la base de datos Supabase es accesible (hostname `db.<ref>.supabase.co`
resuelve), aplica `backend/supabase_schema.sql` en el **Supabase SQL Editor**.
Incluye migraciones DDL, índices, foreign keys, políticas RLS y el INSERT del
admin con su ID de Supabase Auth (`0cd92849-9588-4d4d-aec5-f5d66b8502fa`).

### Troubleshooting: admin role no aparece en JWT

Si el admin login funciona pero `app_metadata.role = 'ADMIN'` no está en el JWT:

1. **Verifica el proyecto de Supabase**: el `iss` del JWT indica el proyecto real.
   Puede diferir entre local (`qwijohugyovepcgrvhlt`) y producción.
2. **Solución SQL** (ejecutar en Supabase Dashboard → SQL Editor del proyecto correcto):
   ```sql
   UPDATE auth.users
   SET app_metadata = app_metadata || '{"role": "ADMIN"}'::jsonb
   WHERE email = 'admin@kitsunova.local';
   ```
3. El usuario debe cerrar sesión y volver a iniciar sesión para obtener un JWT nuevo.
4. Si el proyecto de producción fue eliminado, actualiza las env vars de Vercel:
   ```
   VITE_SUPABASE_URL=https://qwijohugyovepcgrvhlt.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_mvWz3mfUpctYg2nM1ek7g_9Ixa8zo_
   ```
