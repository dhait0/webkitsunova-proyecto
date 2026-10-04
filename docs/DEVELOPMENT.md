# DEVELOPMENT.md — Desarrollo local

## Propósito

Este documento describe cómo ejecutar, validar y trabajar con WebKitsunova localmente.

Debe mantenerse actualizado cuando cambie la arquitectura del proyecto.

---

# 1. Objetivo

El proyecto debe poder desarrollarse localmente con una experiencia simple y reproducible.

Evitar requerir infraestructura innecesaria para tareas normales.

---

# 2. Requisitos esperados

Herramientas principales:

- Node.js
- npm/pnpm según lo definido por el repositorio
- Git
- gh CLI
- Docker cuando sea necesario
- acceso al proyecto Supabase correspondiente

Registrar aquí versiones mínimas cuando queden definidas.

---

# 3. Instalación

Flujo esperado:

```sh
git clone <repo>
cd <repo>
npm install
```

Adaptar si el proyecto utiliza otro package manager.

---

# 4. Variables de entorno

Utilizar un archivo local como:

```text
.env.local
```

No versionar secretos.

Documentar las variables requeridas mediante:

```text
.env.example
```

Ejemplos esperados:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=
DIRECT_URL=
```

Revisar nombres definitivos según la configuración real del proyecto.

---

# 5. Ejecución local

Objetivo:

```sh
npm run dev
```

La aplicación debe poder iniciar en modo desarrollo con el menor número posible de pasos adicionales.

---

# 6. Base de datos local

La estrategia definitiva puede ser una de estas:

## Opción A — Supabase remoto de desarrollo

Utilizar un proyecto separado de Supabase para desarrollo.

## Opción B — Supabase local

Usar Supabase CLI si se decide mantener un entorno local completo.

## Opción C — PostgreSQL local

Usar Docker/PostgreSQL local cuando sea útil.

La opción elegida debe documentarse aquí una vez quede estabilizada.

---

# 7. Prisma

Comandos habituales, si aplican:

```sh
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

Evitar utilizar `prisma db push` como sustituto permanente de migraciones.

Para cambios de esquema durante desarrollo:

1. modificar schema
2. generar migración
3. revisar SQL generado
4. ejecutar localmente
5. probar funcionalidad
6. versionar migración

---

# 8. Validaciones locales

Antes de considerar una tarea terminada ejecutar solo las validaciones necesarias.

Comandos esperados:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Si algunos scripts todavía no existen, crearlos progresivamente.

No ejecutar siempre todas las validaciones para un cambio trivial si una validación localizada es suficiente.

---

# 9. Flujo de ramas local

El desarrollo debe priorizar ramas locales.

Ejemplo:

```sh
git switch -c feature/nombre
```

Después de completar una tarea:

1. revisar `git status`
2. ejecutar pruebas relevantes
3. revisar diff
4. commit
5. mantener el trabajo local hasta que el usuario indique integrarlo

---

# 10. Integración local a staging

Cuando el usuario solicite hacer merge a staging:

```text
rama de trabajo
↓
pruebas locales
↓
staging local
↓
merge
↓
validaciones completas
```

No hacer push automáticamente.

El usuario normalmente realizará:

```sh
git push origin staging
```

cuando decida publicar la rama.

---

# 11. gh CLI

La herramienta `gh` está instalada.

No utilizarla como primera opción para trabajo local.

Usarla principalmente para:

- revisar PRs
- consultar checks
- revisar GitHub Actions
- analizar fallos remotos
- gestionar PRs cuando el usuario lo solicite

Ejemplos:

```sh
gh pr view
gh pr checks
gh run list
gh run view
gh run view --log-failed
```

---

# 12. Proyecto legacy

Ubicación:

```text
/proyecto viejo
```

Tratar como referencia de solo lectura.

No ejecutar ni modificar código legacy salvo que sea necesario para entender comportamiento.

---

# 13. Depuración

Orden recomendado:

1. reproducir el error
2. revisar logs locales
3. localizar archivos directamente relacionados
4. revisar tipos y validaciones
5. revisar base de datos si aplica
6. revisar configuración
7. ampliar búsqueda solo si es necesario

No comenzar recorriendo todo el repositorio.

---

# 14. Calidad

Antes de terminar una tarea:

- revisar diff
- verificar que no haya cambios no relacionados
- comprobar que no se hayan añadido secretos
- eliminar logs temporales
- validar errores TypeScript
- ejecutar pruebas relevantes
- documentar decisiones importantes si corresponde

---

# 15. Scripts recomendados

A medida que el proyecto madure, mantener scripts consistentes como:

```json
{
  "scripts": {
    "dev": "...",
    "lint": "...",
    "typecheck": "...",
    "test": "...",
    "test:integration": "...",
    "build": "..."
  }
}
```

No duplicar scripts innecesarios.
