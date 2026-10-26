# Tickets atómicos para Kilo Auto Free — cinco horas en total

**No ejecutar como megaprompt.** Abrir un ticket a la vez. La duración es un techo de trabajo previsto, no garantía. **Inspección inicial máxima 1–3 archivos**, ampliar solamente por dependencia demostrada. Usar `contexto/MAPA_TECNICO.md`, no redescubrir el repo entero.

| ID | Min | Objetivo único y verificable | Archivos de entrada / límite inicial | Entrega / puerta |
|---|---:|---|---|---|
| S01 | 10 | Confirmar scripts, rama y pruebas disponibles sin auditoría | `package.json`, `AGENTS.md` | Línea base exacta; sin cambios |
| S02 | 15 | Identificar el punto de entrada seguro para acciones sensibles | `lib/auth/guard.ts`, `app/(admin)/admin/actions.ts` | Guardia aplicable; si no cabe, BLOQUEADA, no exponer actions |
| S03 | 25 | Cerrar una ruta prioritaria de autorización Admin con prueba | acción Admin + guard + prueba localizada | Rol no admin rechazado en servidor |
| S04 | 25 | Evaluar estados de cuenta, registro y MFA con cambio mínimo posible | `lib/auth/guard.ts`, `lib/auth/roles.ts`, flujo MFA directo | Prueba de rechazo; bloqueo documentado si requiere rediseño |
| S05 | 20 | Consultar psicólogos elegibles con campos públicos | Prisma schema + servicio/perfil existente | No mostrar pendientes/suspendidos |
| S06 | 25 | Reemplazar tarjetas mock de Psicólogos con consulta real | `features/user/PsychologistsPage.tsx`, consulta S05 | Carga/vacío/error y datos reales |
| S07 | 25 | Conectar perfil y disponibilidad pública de psicólogo | ruta usuario relevante + servicio perfil + slots | Perfil real, sin exponer datos privados |
| S08 | 20 | Establecer contrato de reserva seguro reutilizando servicio existente | `services/psy/appointments.service.ts`, schema, guard | Estado/transiciones/actor definidos |
| S09 | 30 | Crear reserva de usuario sin doble asignación | action usuario + servicio existente + prueba | Autorización, slot válido, colisión rechazada |
| S10 | 15 | Mostrar citas propias reales en Usuario | `features/user/AppointmentsPage.tsx` + consulta | Lista aislada por titular, sin mocks |
| S11 | 25 | Habilitar lectura/envío en chat de Usuario con permisos de miembro | `services/psy/messaging.service.ts`, guard, action | Miembro permitido y ajeno denegado |
| S12 | 25 | Enlazar ChatsPage a conversaciones reales | `features/user/ChatsPage.tsx`, actions S11 | Mensajes reales y estados UI |
| S13 | 30 | Entregar mínimo seguro de hábitos según esquema existente | `features/user/HabitsPage.tsx`, `prisma/schema.prisma` | Si no hay modelo: contrato + migración propuesta sin aplicar; no afirmar CRUD completo |
| S14 | 10 | Comprobar cambios y registrar estado verificable | diffs + tests focalizados | Estado por ticket, pendientes, riesgos |

**Total: 300 minutos.** Dependencias: S05→S06→S07; S08→S09→S10; S11→S12. S03 y S04 pueden bloquear publicación de acciones sensibles. Un fallo de proveedor permite a lo sumo un reintento acotado; luego registrar y cambiar de ticket independiente.
