# Flujo Git obligatorio — Kitsunova

## Regla de ramas

- La rama `staging` **local** es la base de integración del trabajo. No trabajar directamente en `staging` ni en `main`.
- Antes de comenzar un ticket, verificar `git status`, rama actual y existencia de cambios no guardados. Nunca descartarlos.
- Partir de la `staging` **local** actualizada dentro del repositorio local. No hacer `git pull`, `git fetch` ni consultar/remotear `origin/staging` o `origin/main` automáticamente.
- Crear o reutilizar una rama local de tarea desde `staging`: `feature/<ticket>-<tema>` o `fix/<ticket>-<tema>`.
- Si ya se trabaja en la rama de tarea, traer los cambios recientes de la `staging` **local** a esa rama antes de continuar, mediante merge o rebase cuidadosamente elegido. No reescribir commits ajenos ni aplicar rebase destructivo sobre trabajo compartido.
- Tras una integración posterior en `staging` local, actualizar las otras ramas activas desde esa `staging` antes de continuarlas.

## Pruebas y commits: automáticos

- Kilo puede ejecutar automáticamente las pruebas locales necesarias según el riesgo: test dirigido, `typecheck`, `build`, lint solo si está operativo y pruebas ampliadas cuando afectan autorización/datos.
- Al terminar cada ticket implementado y validado, Kilo **debe hacer un commit local automático** de los archivos de ese ticket, sin pedir autorización por cada commit. Usar Conventional Commits y el ID Sxx en el mensaje.
- Antes del commit: revisar `git diff`, `git status`, los cambios no propios y los resultados de las pruebas. Agregar con `git add <rutas concretas>`; evitar `git add .` si mezcla trabajo ajeno. No hacer commit si una prueba crítica falla; dejar evidencia del bloqueo.
- No hacer commits vacíos ni incluir secretos, `.env`, contenido ignorado ni cambios ajenos.

## Integración y Pull Requests

- Finalizar el ticket en su rama local. Si la tarea requiere otros tickets, mantener la rama de trabajo y realizar commits locales incrementales.
- Para preparar la fusión, volver a incorporar la última `staging` **local** a la rama de trabajo y resolver conflictos sin perder trabajo válido. Repetir pruebas pertinentes, incluidos tipos/tests/build según el alcance. La rama debe quedar limpia y verificable.
- **No hacer merge a `staging` local automáticamente** cuando el cambio sea una funcionalidad o conjunto de tickets listo para aceptación: presentar informe, diff, pruebas y estado de integración y solicitar aprobación del usuario.
- **No hacer push ni crear Pull Requests automáticamente**. Tras aprobación expresa, el usuario puede habilitar publicación de la rama y creación del PR con destino `staging`; el usuario es quien **aprueba el Pull Request**. No fusionarlo automáticamente.
- El usuario realiza posteriormente el PR hacia `main`. Kilo jamás crea, fusiona o publica hacia `main` o `origin/main` por iniciativa propia.
- `origin/staging`, `origin/main` y `main` son destinos protegidos para efectos del agente: sin push, merge, reset, force-push, checkout para trabajo, ni despliegues sin una autorización específica y explícita. Aun con autorización para un PR a `staging`, eso NO autoriza intervenir `main`.
- Si hay cambios locales en `staging` que impiden crear la rama, detenerse y reportar; no hacer stash/clean/reset que pueda ocultar o perder trabajo sin una estrategia segura.

## Autonomía por defecto

- Autorizado en tareas de implementación: cambiar archivos incluidos en el ticket, ejecutar pruebas locales, crear ramas locales, integrar **desde staging local hacia la rama de tarea** y crear commits locales.
- Requiere aprobación: mezclar de la rama de tarea **hacia staging local**, push, creación de PR, merge remoto, migraciones aplicadas en producción, despliegues o acciones destructivas fuera del alcance.
- El presupuesto de cinco horas no justifica saltarse pruebas ni seguridad. Ante bloqueo informar y detenerse, sin declarar listo lo que no lo está.
