---
name: project-memory
description: Consultar o mantener memoria técnica duradera y verificada de WebKitsunova en docs/PROJECT_MEMORY.md cuando un patrón arquitectónico, una regla de negocio comprobada o una solución repetible ayude a evitar investigaciones futuras. No guardar políticas globales, secretos o notas temporales.
---

# Project memory

1. Buscar primero la sección relevante en `docs/PROJECT_MEMORY.md`. No cargar ni reescribir íntegramente el archivo si una parte basta.
2. Contrastar cualquier dato crítico contra el código o fuente actual; marcar incertidumbre y fecha cuando importe.
3. Registrar únicamente información verificable, relativamente estable y reutilizable: responsable de un flujo, vínculo entre archivos, invariantes o solución que se ha repetido.
4. Antes de añadir, buscar entrada equivalente; actualizarla en vez de duplicarla.
5. No guardar secretos, tokens, datos personales/de pacientes, credenciales, decisiones hipotéticas, backlog, logs efímeros o instrucciones que deban ser obligatorias para todos los agentes.
6. Mantener las políticas en `AGENTS.md` y las reglas operativas en `.kilo/rules/`; la memoria es evidencia contextual, no autoridad normativa.
7. Si el usuario solicitó solo lectura, proponer la entrada en la respuesta pero **no editar** el documento.
8. Informar qué memoria fue consultada o actualizada y por qué era pertinente.
