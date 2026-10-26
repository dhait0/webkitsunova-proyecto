# Skill routing — selección por dominio

Este documento ayuda al agente a **decidir qué procedimiento consultar**; su existencia no verifica que Kilo Code 7.8.15 cargue reglas o active skills automáticamente. No inferir que una skill fue ejecutada solo porque aparece en esta matriz.

1. Clasificar objetivo, riesgo y superficie.
2. Elegir como máximo la skill primaria pertinente y añadir otra únicamente si resuelve una necesidad distinta.
3. Consultar la documentación de referencia de esa skill según necesidad; no cargar todas las referencias por defecto.
4. Si no hay skill pertinente, continuar con `AGENTS.md`, código y reglas operativas, sin fabricar una.

| Tipo de tarea | Skill primaria | Fuente o revisión adicional |
| --- | --- | --- |
| Cambio local pequeño | `quick-fix` | `.kilo/rules/efficient-changes.md` |
| Diseño, responsive, formularios, navegación visual | `soft-ui-guardian` | `DESIGN.md` y mundo visual específico |
| Animación | `soft-ui-guardian` para gobierno visual; skill de `.agents/skills/` solo si aporta técnica particular | `DESIGN.md`, reducción de movimiento |
| Auth, MFA, roles y Server Actions | Ninguna por defecto | `lib/auth/guard.ts`, acciones y servicios, pruebas de autorización |
| Pacientes, citas, derivaciones, notificaciones | Ninguna por defecto | `services/psy/`, permisos y reglas de negocio |
| Administración y Supabase Admin | Ninguna por defecto | `app/(admin)/admin/actions.ts`, guardias de servidor |
| Prisma, migraciones y despliegues | Ninguna por defecto | `prisma/`, `supabase/migrations/`, workflows; autorización expresa |
| Hallazgo técnico reutilizable | `project-memory` | `docs/PROJECT_MEMORY.md` |
| Auditoría solo lectura | Ninguna obligatoria | Solo evidencia, sin acciones mutantes |

## Separación de responsabilidades
- `AGENTS.md`: límites no negociables y contexto del sistema.
- `efficient-changes.md`: estrategia de búsqueda, alcance y validación proporcional.
- `quick-fix`: aplicación práctica de un cambio acotado; no sustituye reglas globales.
- `soft-ui-guardian`: controles de UI y QA; no redefine reglas de negocio.
- `DESIGN.md`: tokens, identidades, componentes y comportamiento visual canónico.
- `project-memory`: conocimiento duradero, no políticas ni tareas pendientes.

## Decisiones frecuentes
- UI de login: `soft-ui-guardian` únicamente para presentación; si el cambio toca autenticación, elevar riesgo y examinar seguridad por separado.
- Componente pequeño con ajuste responsive: preferir `soft-ui-guardian` si la coherencia visual es central; no encadenar `quick-fix` sin necesidad.
- Cambio de una Server Action administrativa: no clasificar como `quick-fix` aunque sean pocas líneas.
- Ninguna skill puede autorizar operaciones prohibidas por el usuario o por `AGENTS.md`.


## Flujo Git específico de Kitsunova

En trabajo del sprint, aplicar `contexto/planificacion/06_GIT_LOCAL_Y_PR.md`. Permitir ramas de tarea, pruebas y commits locales automáticos. No hacer push, PR, merge hacia `staging` local ni intervención de `main` sin autorización.
