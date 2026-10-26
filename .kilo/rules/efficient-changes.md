# Efficient changes — disciplina operativa

Aplica este procedimiento a investigación y modificaciones autorizadas. Las prohibiciones y límites permanentes se establecen en `AGENTS.md`.

## Delimitar
1. Reescribir el objetivo en una frase e identificar el comportamiento que no debe cambiar.
2. Identificar el propietario más probable: ruta, componente, acción, servicio o esquema.
3. Comenzar por 1–3 archivos directamente relevantes. Es un punto de partida, **no un máximo absoluto**. Ampliar selectivamente al encontrar dependencias o riesgos.
4. Evitar búsquedas globales, reconstrucciones y lecturas integrales del repo cuando una referencia exacta basta.
5. Consultar `docs/PROJECT_MEMORY.md` solo si hay un descubrimiento previamente registrado que ahorre trabajo.

## Ejecutar
- Reutilizar convenciones e interfaces actuales. No reformatear o renombrar zonas ajenas.
- Para tareas pequeñas sin impacto en auth, permisos, datos, migraciones o arquitectura, usar `quick-fix` si está disponible y aporta valor.
- Antes de cambios que toquen varias capas, mapear entrada → autorización → validación → servicio → escritura → efecto visible.
- Separar reestructuraciones, arreglos de seguridad y cambios funcionales en encargos independientes, salvo solicitud expresa.
- Revisar diff para detectar cambios involuntarios, archivos generados, secretos y operaciones destructivas.

## Validar proporcionalmente
| Tipo | Mínimo razonable |
| --- | --- |
| Texto / documentación | Referencias, consistencia y diff |
| TS/React localizado | Typecheck y prueba relevante, cuando sean viables |
| UI/responsive | Estados, teclado, accesibilidad, tamaños de pantalla y sistema visual |
| Server Actions, auth, pacientes | Autorización real, validación runtime, casos negativos, pruebas específicas |
| Migraciones/CI/producción | Revisión del plan, compatibilidad, aprobación expresa antes de ejecutar |

No prometer que se ejecutaron validaciones omitidas. No ejecutar pruebas, builds o comandos cuando el encargo expresamente los prohíbe.

## Git y cierre
- Preferir modificaciones locales pequeñas. Conservar trabajo preexistente; consultar antes de operaciones destructivas o remotas.
- No hacer commits/push/merges/PR por deducción; obedecer `AGENTS.md` y la instrucción específica del usuario.
- Entregar resumen de cambio, alcance, verificaciones y límites. Detenerse al completar el encargo.


## Flujo Git específico de Kitsunova

En trabajo del sprint, aplicar `contexto/planificacion/06_GIT_LOCAL_Y_PR.md`. Permitir ramas de tarea, pruebas y commits locales automáticos. No hacer push, PR, merge hacia `staging` local ni intervención de `main` sin autorización.
