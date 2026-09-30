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
