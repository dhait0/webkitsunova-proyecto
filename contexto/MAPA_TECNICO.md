# Mapa técnico de apertura rápida

| Necesidad | Punto de entrada inicial | Dependencia a revisar solo si procede |
|---|---|---|
| Roles, sesión | `lib/auth/guard.ts`, `lib/auth/roles.ts` | `app/(auth)/`, layouts, `proxy.ts` |
| Admin | `app/(admin)/admin/actions.ts` | pantallas admin, `lib/supabase/admin.ts` |
| Catálogo usuario | `features/user/PsychologistsPage.tsx` | `prisma/schema.prisma`, `services/psy/profile.service.ts` |
| Citas usuario | `features/user/AppointmentsPage.tsx` | `services/psy/appointments.service.ts`, `app/(psychologist)/psy/sesiones/actions.ts` |
| Chats usuario | `features/user/ChatsPage.tsx` | `services/psy/messaging.service.ts` |
| Hábitos | `features/user/HabitsPage.tsx` | `prisma/schema.prisma` antes de proponer entidades |
| Perfil/disponibilidad psi | `services/psy/profile.service.ts` | disponibilidad semanal, `AvailabilitySlot` |
| Tests | `package.json`, `vitest` | `.github/workflows/pr-checks.yml` |
| Diseño | `DESIGN.md` | `.kilo/skills/soft-ui-guardian/references/*` |
| Documentación duradera | `docs/PROJECT_MEMORY.md` | skill project-memory |

Apertura inicial: 1–3 archivos relevantes. Ampliar por dependencia concreta, no por curiosidad. No crear servicios duplicados cuando ya hay equivalentes.
