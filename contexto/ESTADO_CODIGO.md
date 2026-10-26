# Estado conocido de código — punto de partida, no certificación

Resumen de auditoría estática anterior; contrastar con archivos locales actuales antes de cada cambio.

| Superficie | Estado anterior | Acciones recomendadas |
|---|---|---|
| Público | Landing implementada, visual `.kb-*` | Conservar |
| Auth | Login/registro; MFA con rutas identificadas, sin validación E2E completa | Validar los flujos y condiciones |
| Usuario | Dashboard/Citas/Hábitos/Chats/Psicólogos ilustrativos, `content/siteContent` | Reemplazar mocks por integraciones reales de manera vertical |
| Psicólogo | Prisma y servicios reales para dashboard, citas, pacientes, chats, derivaciones, recursos, talleres y perfil | Reutilizar, preservar reglas |
| Notificaciones psicólogo | Servicio de preferencias pero acción UI incompleta | Tratar como incidencia separada |
| Admin | CRUD usuarios, roles, aprobaciones y recuperación; acciones privilegiadas | Autorizar en servidor y validar inputs |

## Riesgos comprobados en lectura previa
- `app/(admin)/admin/actions.ts` sin autorización independiente en las acciones auditadas.
- `lib/auth/guard.ts` devolvía estado `ACTIVE` fijo en la versión inspeccionada.
- Scripts de migración Supabase y duplicidad de historiales `prisma/` + `supabase/`.
- `package.json` reportó `lint: eslint .` sin dependencia eslint declarada en manifest de la copia examinada; verificar antes de basar validaciones en lint.
- `.github/workflows/pr-checks.yml` no ejecutaba lint.

No equiparar inspección estática con pruebas de seguridad ni afirmar que problemas sigan vigentes sin comprobación puntual.
