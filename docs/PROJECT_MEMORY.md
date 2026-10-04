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
