# DEPLOYMENT.md — CI/CD, Vercel y migraciones

## Propósito

Este documento define el flujo objetivo de integración y despliegue de WebKitsunova.

La meta es proteger producción mediante validaciones automatizadas y un flujo de ramas controlado.

---

# 1. Plataformas

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

Control de código:

```text
GitHub
```

---

# 2. Principio general

No desplegar cambios a producción sin pasar por validaciones automáticas.

El pipeline debe actuar como barrera de seguridad, no únicamente como automatización.

---

# 3. Flujo de desarrollo e integración

Flujo esperado:

```text
rama local de trabajo
↓
pruebas locales
↓
merge local a staging cuando el usuario lo solicite
↓
validaciones completas locales
↓
push manual del usuario a origin/staging
↓
Pull Request
↓
GitHub Actions
↓
Preview Deployment
↓
revisión
↓
merge aprobado
↓
producción
```

---

# 4. Reglas de Git

No hacer automáticamente:

- push a ramas remotas
- merge a main
- creación de Pull Requests
- despliegues de producción

salvo solicitud explícita del usuario.

La rama `staging` se usa como integración previa al Pull Request.

---

# 5. GitHub Actions

Los workflows deben ubicarse en:

```text
.github/workflows/
```

Como mínimo, un Pull Request debe validar:

```text
install
↓
lint
↓
typecheck
↓
unit tests
↓
integration tests
↓
build
↓
migration validation
```

---

# 6. Pull Requests

Los Pull Requests deben ser la puerta de entrada a cambios compartidos.

Antes del merge:

- checks verdes
- build exitoso
- tests exitosos
- migraciones revisadas
- sin secretos
- sin cambios no relacionados
- Preview Deployment revisable cuando aplique

---

# 7. Vercel Preview

Utilizar Preview Deployments para Pull Requests cuando sea posible.

Las previews sirven para validar:

- UI
- navegación
- integración
- variables de entorno
- Server Components
- Route Handlers
- compatibilidad de build

No ejecutar migraciones destructivas de producción desde previews.

---

# 8. Producción

La rama de producción debe ser:

```text
main
```

El despliegue a producción debe ocurrir únicamente después de que el cambio haya pasado las validaciones definidas.

---

# 9. Migraciones

Las migraciones deben ser:

- versionadas
- revisables
- reproducibles
- compatibles con CI/CD

Con Prisma, utilizar:

```text
prisma/migrations/
```

No utilizar `prisma db push` como mecanismo normal de producción.

---

# 10. Validación de migraciones

Antes de producción, el pipeline debe poder verificar que:

- el schema es válido
- Prisma Client se genera correctamente
- las migraciones están versionadas
- no faltan archivos de migración
- el build funciona con el schema actual

Cuando sea viable, probar migraciones contra una base temporal o de integración.

---

# 11. Aplicación de migraciones

Después de superar validaciones, producción puede ejecutar:

```sh
npx prisma migrate deploy
```

o el mecanismo equivalente definido por el proyecto.

La ejecución debe ocurrir en un entorno controlado con acceso a las credenciales necesarias.

---

# 12. Orden despliegue / migración

No asumir que siempre es seguro migrar antes de desplegar.

Para cambios compatibles:

```text
CI verde
↓
migración
↓
deploy
↓
smoke tests
```

Para cambios incompatibles o destructivos usar estrategia gradual:

```text
fase 1: agregar estructura compatible
↓
deploy compatible
↓
migrar datos
↓
verificar
↓
fase 2: retirar estructura antigua
```

---

# 13. Migraciones destructivas

Tratar con especial cuidado:

- eliminar columnas
- renombrar columnas
- eliminar tablas
- cambiar tipos
- hacer campos obligatorios
- modificar relaciones
- eliminar índices críticos

No ejecutar automáticamente una migración destructiva sin revisión.

---

# 14. GitHub Secrets

Guardar secretos del pipeline en GitHub Secrets o mecanismos equivalentes.

Nunca versionar:

- DATABASE_URL
- DIRECT_URL
- service role keys
- tokens
- secretos de Vercel
- claves administrativas

---

# 15. Vercel Environment Variables

Mantener variables separadas por ambiente:

- Development
- Preview
- Production

No asumir que Preview y Production deben utilizar la misma base de datos.

---

# 16. Base de datos de Preview

Preferir una estrategia que evite que una Preview Deployment modifique datos críticos de producción.

Opciones posibles:

- proyecto Supabase de staging
- branch/database separada
- base de integración
- credenciales de solo lectura para determinados flujos

Documentar aquí la estrategia definitiva cuando se decida.

---

# 17. Uso de gh CLI

Cuando falle un PR o GitHub Actions, utilizar `gh` para investigar.

Ejemplos:

```sh
gh pr checks
gh pr view
gh run list
gh run view
gh run view --log-failed
```

Primero identificar la causa concreta.

No modificar código al azar para intentar hacer pasar CI.

---

# 18. Smoke tests

Después de un despliegue importante, validar al menos:

- página principal carga
- login responde
- rutas protegidas funcionan
- API crítica responde
- conexión a base de datos funciona

Ampliar según funcionalidades críticas.

---

# 19. Rollback

Antes de automatizar producción completamente, definir una estrategia de rollback.

Debe considerar por separado:

- código
- migraciones
- datos

Un rollback de aplicación no implica necesariamente que una migración sea reversible.

---

# 20. Objetivo futuro

El pipeline ideal debe permitir que un cambio correctamente probado avance con mínima intervención manual, pero sin sacrificar seguridad.

Priorizar:

```text
reproducibilidad
+
validación
+
observabilidad
+
rollback
+
simplicidad
```

sobre automatización excesiva.
