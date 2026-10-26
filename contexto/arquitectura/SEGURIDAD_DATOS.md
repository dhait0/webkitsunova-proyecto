# Límites de seguridad de los verticales

1. Server Actions son límites accesibles desde cliente: autenticar, autorizar rol, titularidad, relaciones y validar entradas en servidor; layout/proxy no bastan.
2. Roles vienen del origen autorizado de la sesión, no de un dato editable por Usuario. Estados de cuenta deben evaluarse realmente.
3. Psicólogo: proteger `PsyPatient`, `Appointment`, `ConversationMember`, `PatientReport`; conservar reglas existentes.
4. Admin: exigir comprobación propia de privilegio por operación, especialmente `deleteUser`, `updateUserRole`, resets de contraseña y aprobaciones.
5. Datos emocionales: privacidad por defecto; no exponer en logs, analytics, pruebas públicas, perfiles profesionales ni agregados sin decisión expresa.
6. Migraciones: propuesta y revisión primero. No ejecutar en producción sin aprobación. Evitar dos historiales de esquema divergentes.
7. No debilitar permisos para acelerar desarrollo. En caso de bloqueo, registrar evidencia y descomponer tarea.
