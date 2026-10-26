---
name: quick-fix
description: Aplicar cambios pequeños y localizados de bajo riesgo en WebKitsunova, como textos, estilos puntuales, tipos o condiciones aisladas. No utilizar para autenticación, roles, Server Actions privilegiadas, pacientes, migraciones, arquitectura o producción.
---

# Quick fix

## Procedimiento
1. Confirmar un único resultado esperado y el comportamiento que debe conservarse.
2. Leer el archivo responsable y, si corresponde, uno o dos consumidores inmediatos. La regla de 1–3 archivos es inicial, no prohibición de examinar dependencias relevantes.
3. Revisar patrones existentes y el diff antes de editar.
4. Cambiar lo mínimo indispensable sin reformatear archivos ajenos ni incluir mejoras no pedidas.
5. Si aparece una dependencia de seguridad, datos sensibles, permisos, migraciones o arquitectura, abandonar la clasificación de quick-fix y reclasificar riesgo antes de continuar.
6. Validar proporcionalmente al cambio; reportar lo que efectivamente se verificó.
7. Resumir y detenerse.

Para cambios visuales que afecten identidad, responsive, estados o accesibilidad, seguir `DESIGN.md` y considerar `soft-ui-guardian` como skill primaria en vez de encadenar ambas indiscriminadamente.

Respetar siempre `AGENTS.md` y `.kilo/rules/efficient-changes.md`. Una petición de auditoría solo lectura no autoriza editar.
