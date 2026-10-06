# PROJECT_MEMORY.md — WebKitsunova

## Propósito

Este documento almacena conocimiento técnico y arquitectónico descubierto durante el desarrollo de WebKitsunova.

Su objetivo es evitar que los agentes tengan que volver a investigar flujos, relaciones y decisiones que ya fueron comprendidos anteriormente.

No utilizar este archivo como:

- changelog
- backlog
- lista general de tareas
- documentación para usuarios
- registro de cada modificación realizada

Registrar únicamente conocimiento que probablemente vuelva a ser útil.

---

# 1. Arquitectura general

WebKitsunova está siendo reconstruido a partir de una aplicación legacy ubicada en:

```text
/proyecto viejo
```

El proyecto legacy sirve principalmente como referencia funcional.

No debe utilizarse como referencia arquitectónica.

La arquitectura objetivo es una aplicación full-stack unificada utilizando principalmente:

- Next.js
- React
- TypeScript
- Supabase Auth
- PostgreSQL en Supabase
- Prisma
- Zod
- Vercel
- GitHub Actions

El objetivo es mantener:

```text
1 repositorio
1 aplicación full-stack
1 proyecto de Vercel
1 pipeline principal
```

## Estado actual: unificación completada

La migración desde `frontend/` (Vite + React Router) y `backend/` (Express + supertest) está
hecha. Ya no existen esos directorios.

Mapa de lo que reemplazó a cada pieza:

| Antes | Ahora |
| --- | --- |
| `frontend/` + `backend/` | un único proyecto Next.js en la raíz |
| Vite + React Router | App Router, 31 rutas en `app/` |
| 61 endpoints Express | llamadas directas a `services/psy/` desde Server Components |
| localStorage + `Authorization: Bearer` | cookies de sesión de Supabase vía `@supabase/ssr` |
| `backend/src/lib/supabase.ts` (JWKS manual) | `lib/supabase/{server,browser,admin}.ts` |
| middleware de Express `requireRole` | `lib/auth/guard.ts` + layouts por rol |
| `Jenkinsfile` + vercel.json por paquete | GitHub Actions + despliegue nativo de Vercel |
| `middleware.ts` | `proxy.ts` (Next.js 16 renombró la convención) |

Estructura de `app/`:

```text
app/
├── layout.tsx
├── (public)/page.tsx              → /
├── (auth)/login, mfa/*            → /login, /mfa/*
├── (user)/layout.tsx              → guard USER
│   └── dashboard/*                → /dashboard/*
├── (psychologist)/layout.tsx      → guard PSYCHOLOGIST (admite ADMIN)
│   └── psy/*                      → /psy/*
└── (admin)/layout.tsx             → guard ADMIN
    └── admin/*                    → /admin/*
```

Los grupos entre paréntesis existen para conservar los nombres de carpeta de `agents.md`
(`user/`, `psychologist/`, `admin/`) sin alterar las URLs públicas, que ya estaban
contratadas como `/dashboard/*`, `/psy/*` y `/admin/*`.

---

# 2. Infraestructura

## Producción

Aplicación:

```text
Vercel
```

Base de datos:

```text
Supabase PostgreSQL
```

Autenticación:

```text
Supabase Auth
```

CI/CD:

```text
GitHub Actions
```

---

# 3. Estrategia Git

El desarrollo e integración deben realizarse principalmente de forma local.

Flujo habitual:

```text
rama local de trabajo
↓
desarrollo
↓
pruebas locales
↓
merge local a staging cuando el usuario lo solicite
↓
validación completa de staging
↓
push manual del usuario a origin/staging
↓
Pull Request en GitHub
↓
GitHub Actions
↓
producción
```

Kilo no debe realizar automáticamente:

- push remoto
- merge a main
- creación de Pull Request
- despliegues

salvo solicitud explícita.

---

# 4. Proyecto legacy

Ubicación:

```text
/proyecto viejo
```

Debe tratarse como READ-ONLY salvo solicitud explícita.

Consultar únicamente cuando sea necesario descubrir:

- funcionalidades existentes
- flujos de usuario
- reglas de negocio
- pantallas
- entidades
- comportamiento esperado

Después implementar una versión moderna de la funcionalidad.

---

# 5. Dominios conocidos

Actualmente se conocen al menos los siguientes dominios:

## Usuarios

Relacionado con:

- bienestar
- hábitos
- seguimiento personal
- recursos
- talleres
- comunicación
- interacción con psicólogos

## Psicólogos

Existe una experiencia específica para profesionales.

Sus funcionalidades deben investigarse y documentarse progresivamente.

## Administración

Área destinada a gestionar elementos globales de la plataforma.

## Sitio público

Página pública informativa de Kitsunova.

---

# 6. Autenticación

Proveedor:

```text
Supabase Auth
```

Roles funcionales conocidos:

```text
USER
PSYCHOLOGIST
ADMIN
```

No confundir los roles funcionales de Kitsunova con los roles internos de autenticación de Supabase.

Para información detallada consultar:

```text
docs/AUTH.md
```

---

# 7. Base de datos

Motor:

```text
PostgreSQL
```

Proveedor de producción:

```text
Supabase
```

ORM:

```text
Prisma
```

Los cambios estructurales deben realizarse mediante migraciones versionadas.

Evitar utilizar `prisma db push` como mecanismo de modificación de producción.

---

# 8. Decisiones arquitectónicas

## Aplicación full-stack

Se busca eliminar progresivamente la separación rígida entre frontend y backend independientes.

La arquitectura objetivo debe permitir desplegar la aplicación como un único proyecto de Vercel.

## CI/CD

GitHub Actions reemplaza Jenkins como sistema principal de CI/CD.

## Rama de integración

`staging` se utiliza como rama local de integración antes de publicar los cambios.

## Proyecto legacy

El proyecto antiguo se consulta para entender funcionalidad, no para copiar patrones técnicos.

## Sistema de diseño por superficie

DESIGN.md describe solo el landing público. Cada superficie de app vive en su
propio mundo con tokens propios, para no mezclar lenguajes visuales:

- Landing público: clases `.kb-*` (global.css)
- Administración: tokens `--admin-*` y clases `.admin-*` (admin.css)
- Psicólogos: tokens `--psy-*` y clases `.psy-*` (psy.css)
- Usuarios: tokens `--user-*` y clases `.user-*` (styles/user.css), activado
  envolviendo el árbol en `.user-root` desde `app/(user)/layout.tsx`

Regla: una superficie no consume tokens de otra. El cromo global de `body`
(fondo índigo oscuro, glows fijos con `pointer-events: none`) es compatible con
las cuatro superficies y no requiere tratamiento especial.

---

# 9. Flujos conocidos

Añadir aquí los flujos que hayan sido investigados.

Formato recomendado:

## Nombre del flujo

### Objetivo

Descripción corta.

### Recorrido

```text
UI
↓
acción
↓
servidor
↓
servicio
↓
base de datos
```

### Archivos relevantes

- `ruta/archivo.ts`
- `ruta/archivo.tsx`

### Decisiones importantes

- decisión
- decisión

### No hacer

- patrón incorrecto conocido

---

# 10. Problemas conocidos y soluciones

Registrar únicamente problemas que puedan repetirse.

Formato:

## Problema

Síntoma:

```text
...
```

Causa:

```text
...
```

Solución:

```text
...
```

Evitar registrar errores triviales o de una sola vez.

## Problema

Síntoma:

```text
El frontend en el puerto 5174 responde con:
ENOENT: no such file or directory, open '/app/index.html'
```

Causa:

```text
El puerto 5174 no lo tenía el stack de este proyecto, sino contenedores de otro proyecto de
Docker llamado `usuario`, creado desde un worktree de Agent Manager en
`.kilo/worktrees/usuario`. Ese worktree ya no existe (el directorio está vacío y
`.kilo/agent-manager.json` no registra worktrees), pero sus contenedores llevaban 32 horas vivos y
sus bind mounts apuntaban a archivos borrados, así que `/app/index.html` no existía.

Además el stack real estaba apagado: `docker compose ps` no mostraba ningún servicio vivo.
```

Solución:

```text
1. Identificar el ocupante del puerto antes de tocar código:
   docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
   lsof -nP -iTCP:5174 -sTCP:LISTEN
2. Retirar los contenedores huérfanos (sin -v, para no borrar volúmenes):
   docker rm -f <nombre>-frontend-1 <nombre>-backend-1 <nombre>-postgres-1
3. Levantar el stack real: docker compose up -d
```

## Problema

Síntoma:

```text
El contenedor de frontend entra en Restarting (1) y Vite muere con:
[Failed to load PostCSS config: Loading PostCSS Plugin failed: Cannot find module 'tailwindcss']
```

Causa:

```text
El volumen nombrado `webkitsunova_proyecto_frontend_node_modules` es de antes de que Tailwind
fuera dependencia. El compose monta `./frontend:/app` más ese volumen sobre `/app/node_modules`, y
el volumen obsoleto tapa las dependencias que sí trae la imagen, así que PostCSS no encuentra
tailwindcss.
```

Solución:

```text
1. Confirmar que el volumen está obsoleto:
   docker run --rm -v <proyecto>_frontend_node_modules:/v alpine sh -lc 'ls -d /v/tailwindcss'
2. El volumen tiene que estar en uso, así que primero se retira el contenedor:
   docker compose rm -f frontend
3. Se borra el volumen y se recrea; Docker lo repuebla desde la imagen:
   docker volume rm <proyecto>_frontend_node_modules
   docker compose up -d frontend
```

Nota: no reemplazar el volumen nombrado por un bind mount de `node_modules` del host. Las
dependencias del host son binarios para macOS y no corren dentro del contenedor alpine.

---

# 11. Descubrimientos pendientes

Esta sección NO debe convertirse en backlog.

Puede utilizarse temporalmente para señalar áreas cuyo comportamiento todavía no se comprende completamente.

Actualmente:

- funcionamiento completo del área de psicólogos
- relaciones entre psicólogos y usuarios
- estructura definitiva de hábitos
- funcionamiento de talleres
- funcionalidades completas disponibles en `/proyecto viejo`

Eliminar un punto cuando la arquitectura correspondiente quede documentada.

# 12. Detalles de la unificación que conviene no redescubrir

## Por qué `proxy.ts` y no `middleware.ts`

Next.js 16 renombró la convención del archivo a `proxy.ts`. No es una preferencia de estilo: con
`middleware.ts` el build falla. El nombre cambió para que el archivo no se confunda con el
middleware de Express del proyecto anterior.

## Doble capa de autorización, a propósito

- `proxy.ts` corre en Edge. Solo lee el rol de la sesión para no renderizar una página que va a
  redirigir. Es una puerta optimista: no revalida nada.
- `lib/auth/guard.ts` corre en el runtime de Node y llama a `supabase.auth.getUser()`. Este es el
  que autoriza de verdad, y se ejecuta en los layouts por rol.

Confiar solo en `proxy.ts` sería un fallo de seguridad: el contenido de un JWT no verificado no
prueba nada. Si añades una ruta nueva protegida, pon el guard en su layout.

`requireRole('PSYCHOLOGIST')` admite también a ADMIN, para que un administrador pueda inspeccionar
esa área. Los servicios de `services/psy/` siguen rechazando a quien no sea psicólogo.

## `lib/use-string-param.ts`

Los parámetros de ruta en App Router vienen como `string | string[] | undefined`. Los componentes
cliente que se migraron desde React Router accedían a `params.id` y asumían `string`.
`useStringParam(name)` normaliza ese caso una sola vez en lugar de repetir el chequeo en cada
componente.

## `'use client'` por heuristics

Durante la migración se marcaron como cliente los archivos de `features/`, `hooks/` y
`components/` que usan hooks de React o `framer-motion`. Las páginas todavía son componentes
cliente en su mayoría: los datos siguen pasándose por props desde `lib/api.ts`, que está adaptado a
Supabase SSR. La conversión a Server Components con acceso directo a `services/psy/` queda como
trabajo pendiente.

Ojo: un archivo sin hooks puede seguir necesitando `'use client'` si importa algo que sí lo
necesita. El error aparece en el build como
`You're importing a module that depends on useState into a React Server Component module`, y la
traza de imports indica exactamente qué archivo marcar.

## Migración de Supabase Auth

Se eliminó la verificación manual de JWT contra JWKS que hacía el backend. `@supabase/ssr` mantiene
la sesión en cookies httpOnly y refresca el token cuando toca, así que ya no hace falta lógica
propia. Consecuencia práctica: no volver a guardar el access token en `localStorage`.

`SUPABASE_SECRET_KEY` solo se usa en `lib/supabase/admin.ts`, que está marcado `server-only`.

## `DATABASE_URL` debe ser el pooler

En Vercel, las conexiones directas a Postgres agotan el límite de clientes. `DATABASE_URL` apunta
al Transaction pooler (puerto 6543) y `DIRECT_URL` a la conexión directa (puerto 5432), que es la
que usan las migraciones.

## Variables de entorno

`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` son obligatorias incluso para
`next build` en local. Next.js inlinea las variables `NEXT_PUBLIC_*` en tiempo de build; sin ellas
el build aborta. No es un problema solo de runtime.

Los nombres viejos (`VITE_SUPABASE_*`, `CORS_ORIGIN`, `FRONTEND_URL`, `VITE_API_URL`,
`BACKEND_PORT`, `JWT_SECRET`) quedaron sin uso y se eliminaron. `CORS_ORIGIN` y `FRONTEND_URL`
desaparecieron porque al haber un solo origen, Next.js no necesita CORS.

---
