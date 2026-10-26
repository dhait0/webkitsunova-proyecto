# Diseño y gobernanza visual de Kitsunova

## Fuente de verdad
El archivo **`/DESIGN.md`** (raíz del repositorio) es la fuente de verdad visual. El paquete de entrega incluye una copia exacta del `DESIGN.md` extraído del ZIP del proyecto, para que no falte cuando se use `contexto/`. **No lo dupliques dentro del repositorio**: mantenlo una sola vez en la raíz.

## Instrucciones para Kilo
1. Antes de una tarea de UI, leer las secciones relevantes de `/DESIGN.md`; no es necesario cargar todo el documento para un ajuste pequeño.
2. Aplicar `.kilo/skills/soft-ui-guardian/SKILL.md` y, si hace falta, una referencia pertinente de su carpeta `references/`.
3. Respetar mundos separados: landing pública `.kb-*` (índigo/violeta, no neumórfica), aplicación de Usuario/Psicólogo/Admin (Soft UI contenido); autenticación sigue el mundo donde se presenta.
4. Reutilizar componentes existentes; no tocar lógica de negocio al mejorar la UI.
5. Probar vistas al menos en móvil y escritorio; foco visible, navegación por teclado, contenido sin desbordes, mensajes de carga/error/vacío y `prefers-reduced-motion`.
6. No imponer los breakpoints de la landing a la aplicación; verificar el CSS concreto antes de alterar cualquier regla.

## Puntos documentales que deben verificarse sin bloquear funcionalidades
- El documento dice `design.md` en algunas referencias aunque el nombre canónico es `DESIGN.md`.
- La instrucción de no dar glow al zorro contradice el glow existente especificado como único permitido. No agregar efectos nuevos; corregir el texto cuando se autorice.
- El CSS de la superficie Usuario puede tener breakpoints diferentes de los generales citados: comprobar antes de editar.

## Uso con tareas por horas
Para una tarea C/D/E/F de interfaz, consultar el apartado pertinente del diseño, reutilizar el componente existente y limitar los cambios a la vista necesaria. No rediseñar todo el producto antes de conectar el flujo.
