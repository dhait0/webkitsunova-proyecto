---
name: soft-ui-guardian
description: Proteger el sistema visual de WebKitsunova en tareas de UI, componentes, responsive, accesibilidad, formularios, tablas, modales, navegación o animaciones. Distinguir landing pública de las superficies Soft UI de Usuario, Psicólogo y Administración y preservar la lógica de negocio existente.
---

# Soft UI Guardian

`DESIGN.md` es la fuente visual canónica y usa esa capitalización exacta. Antes de editar, identificar la superficie afectada y consultar solo los apartados de diseño y referencias pertinentes.

## Flujo de revisión
1. Clasificar la superficie: landing pública (`.kb-*`), Usuario/Psicólogo, o Administración. No trasplantar tokens de un mundo a otro.
2. Localizar el componente existente y alternativas reutilizables. Mantener contratos, eventos, datos, navegación, roles y Server Actions sin modificaciones no solicitadas.
3. Seguir tokens, escala, espaciado, tipografía, sombras y estados de `DESIGN.md`; evitar valores arbitrarios cuando existan tokens.
4. Diseñar mobile-first usando los breakpoints correspondientes a ese mundo. Revisar ancho mínimo, overflow y objetivos táctiles.
5. Asegurar estados de carga, vacío, error, deshabilitado y foco cuando correspondan. Usar HTML semántico y navegación por teclado.
6. Para diálogos: roles accesibles, foco inicial, confinamiento del foco, cierre coherente y devolución del foco; reutilizar componentes existentes (como `AdminModal`) cuando resulte aplicable.
7. Para animación: movimiento no esencial discreto, animar preferiblemente `transform`/`opacity`, evitar saltos de layout y respetar `prefers-reduced-motion`. Confirmar duraciones contra `DESIGN.md`.
8. Comparar el resultado con la identidad específica, revisar diff y ejecutar solo comprobaciones permitidas por la tarea.
9. Informar cambios visuales, comportamiento preservado y validaciones realmente realizadas.

## Límites
- No tocar autorización, sesión, lógica de citas/pacientes, validación de datos, esquema ni migraciones por una solicitud exclusivamente visual.
- Un formulario visual no implica permiso para introducir una Server Action nueva.
- No confundir las vistas ilustrativas de Usuario con funcionalidades ya conectadas.
- Las referencias complementarias existentes en `references/` pueden consultarse de forma selectiva; esta propuesta de reemplazo **no incluye ni elimina** esos archivos.
- Seguir `AGENTS.md` y las restricciones expresas del usuario, incluso cuando la skill sugiera más comprobaciones.
