# Módulo de Psicólogo — Análisis funcional y plan de implementación

Documento de diseño para el worktree `psicologo`. Define qué necesita un usuario con
rol `PSYCHOLOGIST`, cómo atiende a los usuarios finales, cómo se relaciona con otros
psicólogos y con el administrador, y cómo se implementa sobre la base técnica actual.

---

## 1. Punto de partida: qué existe hoy

| Área | Estado |
|---|---|
| Rol `PSYCHOLOGIST` | Existe en `backend/prisma/schema.prisma:12` y se resuelve en `backend/src/lib/role.ts` |
| Aprobación de psicólogo | `GET /api/admin/psychologists` + `PATCH /api/admin/psychologists/:id/approve` (`backend/src/routes/admin.ts`) |
| Frontend de psicólogo | **No existe.** No hay layout, rutas ni páginas `psy` |
| Redirección por rol | No existe: un psicólogo cae en `DashboardLayout` (panel de usuario) |
| Modelos de dominio | Solo `User`, `Profile`, `PsychologistProfile`, `Session` |
| Endpoints `requireRole('PSYCHOLOGIST')` | **Cero** en producción (solo aparece en tests) |

Conclusión: el rol está *declarado* pero no *implementado*. Este worktree cierra esa brecha.

---

## 2. Funciones que necesita el psicólogo

Fuente: `Mockups/Mockups Psy/` (27 pantallas) + `docs/documentacion.md` §5.4.

### 2.1 Identidad y acceso
- Login por correo/contraseña, Google OAuth y MFA (TOTP) — reutiliza lo ya construido.
- Redirección por rol: `PSYCHOLOGIST` → `/psy`, `ADMIN` → `/admin`, `USER` → `/dashboard`.
- Cambio de contraseña, cambio de correo, cambio de teléfono, eliminación de cuenta
  (mockups Psy 20–23). Supabase cubre los tres primeros; la eliminación requiere
  endpoint propio con doble confirmación (texto `ELIMINAR`).

### 2.2 Agenda y atención al paciente
- Dashboard "Panel de seguimiento emocional" (Psy 0/1): próxima sesión, pacientes
  activos, mensajes pendientes, pacientes recientes con **estado emocional** y
  **última actividad**.
- "Sesiones de hoy" (Psy 2) y "Próximas sesiones" (Psy 3): paciente, fecha, hora,
  estado, motivo.
- Cambio de estado de una cita: pendiente → confirmada → realizada / cancelada /
  no assistió.

> Brecha conceptual: los mockups muestran citas y pacientes, pero **no muestran cómo
> nace el vínculo**. Ver §6 (decisiones abiertas).

### 2.3 Pacientes
- Listado con estado emocional, última actividad y acción "Ver perfil" (Psy 0/1).
- Ficha del paciente: historial de sesiones, estado de ánimo registrado por el propio
  usuario, notas privadas del psicólogo y reportes.
- El psicólogo **solo** ve datos de pacientes con los que tiene vínculo establecido.
  Nunca lista el padrón global de usuarios.

### 2.4 Mensajería
- Panel de mensajes con pestañas Todos / No leídos / Grupos, búsqueda, contador
  (Psy 15/17), detalle de conversación con historial y presencia online (Psy 16).
- Acciones rápidas: Archivos, Vaciar chat, Bloquear, Reportar usuario.
- "Soporte Kitsunova" como conversación de sistema (visible en Psy 16).

### 2.5 Talleres (propios)
- CRUD completo: crear, listar, detalle, **inscriptos** (Psy 6–10).
- Campos: imagen de portada, título, descripción, fecha, hora, duración, cupos
  máximos, precio (gratis/pago), área de enfoque.
- Estados: **PENDIENTE → APROBADO / RECHAZADO** por el administrador.
- Estadísticas: total talleres, inscripciones totales, tasa de ocupación, próximos.

### 2.6 Recursos (propios)
- CRUD completo: crear, listar, detalle (Psy 11–14).
- Tipos: Artículo, PDF, Ejercicio, Video. Campos: portada, título, descripción, área
  de enfoque, tiempo de lectura, archivo.
- Estados: **PENDIENTE → APROBADO / RECHAZADO** por el administrador.

### 2.7 Perfil profesional
- Vista pública de perfil (Psy 5): nombre, correo, ubicación, fecha de nacimiento,
  especialidades, tarifa por sesión, horarios de atención, disponibilidad.
- Edición (Psy 19, 24–26): biografía, especialidades, tarifa, horarios semanales.
- Visible en el directorio público de psicólogos solo si
  `isApproved = true` y `status = ACTIVE`.

### 2.8 Notificaciones y configuración
- Centro de notificaciones (Psy 4): no leídas, "marcar todas como leídas",
  pestañas Todas / General.
- Preferencias (Psy 18): nuevas citas, mensajes nuevos, reportes de pacientes,
  cambios emocionales, novedades de la plataforma.
- Apariencia: tema claro/oscuro/sistema, color de acento, tamaño de texto.

---

## 3. Cómo se relaciona con los usuarios finales

```
   Usuario final                    Psicólogo
        │                              │
        │  1. Se registra (USER)       │
        │  2. Explora el directorio    │
        │     público de psicólogos    │
        │  3. Solicita cita ──────────►│  agenda + disponibilidad
        │  4. Acepta / recibe sesión   │
        │  5. Registra hábitos/ánimo ──►│  estado emocional del paciente
        │  6. Mensajería 1-a-1 ◄──────►│
        │  7. Asiste a talleres        │
        │  8. Valora al psicólogo ─────►│  rating / reviewsCount
```

Reglas de permisos:
1. El usuario ve la lista pública de psicólogos **aprobados y activos**.
2. El usuario agenda sobre slots del horario de atención publicado por el psicólogo.
3. Al confirmarse la primera cita nace el vínculo `PsyPatient`.
4. El psicólogo accede al historial de hábitos/ánimo **solo** de sus pacientes.
5. El usuario puede abrir el chat, bloquear y reportar.
6. El usuario valora al psicólogo solo tras al menos una sesión completada.

---

## 4. Cómo se relaciona con otros psicólogos

Los mockups **no muestran interacción directa entre psicólogos**: no hay chat entre
pares, ni foro de colegas, ni mensajería peer-to-peer. El modelo es de **marketplace
paralelo**, no de red.

Lo que sí existe hoy y debe respetarse:
- Directorio público con varios psicólogos (especialidad, tarifa, país, valoración).
- Cada uno gestiona **solo** su propio contenido, pacientes, citas y métricas.
- `rating` y `reviewsCount` en `PsychologistProfile` son la única señal pública de
  calidad relativa.

Propuesta de relación mínima y segura (a confirmar, ver §6):
- **Derivación (referral)**: un psicólogo puede recomendar a un paciente hacia otro
  colega cuando su especialidad no cubre el caso. Se registra como solicitud
  in-app, no como traspaso de datos clínicos: el paciente decide a quién escribe.
- **Sin** mensajería directa entre colegas, **sin** acceso a la agenda ajena,
  **sin** visibilidad de pacientes de otro colega.
- Estadísticas agregadas solo para el administrador.

---

## 5. Cómo se relaciona con el administrador

El administrador es la única figura con supervisión sobre el psicólogo. Cinco flujos:

| Flujo | Dirección | Estado / mecanismo |
|---|---|---|
| Alta y aprobación del psicólogo | Admin → Psy | `AccountStatus.PENDING` → `ACTIVE` + `PsychologistProfile.isApproved` |
| Aprobación de talleres | Psy crea (PENDIENTE) → Admin aprueba | `WorkshopStatus` |
| Aprobación de recursos | Psy crea (PENDIENTE) → Admin aprueba | `ResourceStatus` |
| Verificación documental | Admin revisa | `verified` (mockup Admin 14) |
| Suspensión / eliminación | Admin → Psy | `AccountStatus.SUSPENDED` |

La nota visible en Psy 6/11 es la regla de negocio central del módulo:
> "Los talleres/recursos se crean en estado PENDIENTE y serán visibles para los
> usuarios solo después de la aprobación del administrador."

Reglas adicionales:
- Un psicólogo **suspendido** conserva su cuenta pero pierde acceso a `/psy`
  (guard de rol + de estado) y su perfil sale del directorio.
- Un psicólogo **no aprobado** puede entrar a `/psy` en modo restringido: completar
  perfil, ver estado de aprobación, crear contenido (queda PENDIENTE), pero no
  atender pacientes ni aparecer en el directorio.
- El admin ve por psicólogo: especialidad, estado, pacientes, valoración, última
  actividad, y las acciones "Ver perfil completo / Editar información / Verificar
  documentos / Suspender cuenta / Eliminar cuenta" (mockups Admin).
- Reportes de plataforma: psicólogo nunca ve datos de otro ni agregados globales.

---

## 6. Decisiones de negocio resueltas

Estas decisiones quedaron tomadas y condicionan el modelo de datos de §7.

| # | Decisión | Elección | Impacto técnico |
|---|---|---|---|
| D1 | Nacimiento del vínculo paciente ↔ psicología | El usuario pide cita en el directorio público y el psicólogo acepta | `PsyPatient` se crea al pasar la cita a `CONFIRMED` |
| D2 | Pacientes simultáneos | Un solo psicólogo a la vez | `PsyPatient` con `status` y `endedAt`; se valida que no exista otro `ACTIVE` para el mismo paciente |
| D3 | Relación entre psicólogos | Sí, derivación con consentimiento del paciente | Modelo `PsyReferral`; no hay mensajería entre pares |
| D4 | Pagos | Solo informativos | No se crea modelo `Payment`; `sessionPrice` y `Workshop.priceCents` se muestran y no se cobran |

Consecuencias:
- D1 + D2: al confirmar una cita con un psicólogo B mientras el paciente ya tiene
  un vínculo `ACTIVE` con A, el servicio **debe** cerrar el vínculo con A
  (`status = ENDED`, `endedAt = now`) o rechazarla con `409`. Se recomienda cerrar
  automáticamente y registrar el cambio en `PsyPatient.endedAt`.
- D3: el paciente es quien confirma la derivación. El psicólogo que recibe la
  derivación no obtiene acceso a los datos del paciente hasta que este acepta; la
  primera cita derivada es la que crea el vínculo (mismo camino que D1).
- D4: los importes se guardan como enteros en la moneda local del psicólogo
  (`PsychologistProfile.currency`, default `COP`).

Pendientes menores, no bloquean la Fase 1:
- Si los horarios semanales admiten varios bloques por día (hoy: un bloque por día).
- Si "Reportes de pacientes" son datos de hábitos/ánimo o informes manuales.
- Si la eliminación de cuenta de psicólogo anonimiza o borra en cascada.

---

## 7. Modelo de datos propuesto

Amplía `backend/prisma/schema.prisma`. Nombres sujetos a las decisiones de §6.

```prisma
enum AppointmentStatus { PENDING CONFIRMED COMPLETED CANCELLED NO_SHOW }
enum AppointmentType   { FIRST_SESSION FOLLOW_UP URGENT }
enum ContentStatus     { PENDING APPROVED REJECTED DRAFT }
enum WorkshopArea      { ANXIETY DEPRESSION STRESS PRODUCTIVITY MINDFULNESS ... }
enum ResourceType      { ARTICLE PDF EXERCISE VIDEO }
enum PatientLinkStatus { ACTIVE PAUSED ENDED }
enum ReferralStatus    { PENDING ACCEPTED DECLINED CANCELLED }

model AvailabilitySlot {
  id             String   @id @default(cuid())
  profileId      String
  weekday        Int      // 1 = lunes ... 7 = domingo
  startMinutes   Int      // minutos desde medianoche
  endMinutes     Int
  profile        Profile  @relation(...)
  @@index([profileId, weekday])
}

model PsyPatient {
  id             String           @id @default(cuid())
  psychologistId String
  patientUserId  String
  status         PatientLinkStatus @default(ACTIVE)
  startedAt      DateTime         @default(now())
  endedAt        DateTime?
  psy            User             @relation("psyPatients", ...)
  patient        User             @relation("userPatients", ...)
  @@unique([psychologistId, patientUserId])
}

model Appointment {
  id              String            @id @default(cuid())
  psychologistId  String
  patientUserId   String
  startsAt        DateTime
  endsAt          DateTime
  type            AppointmentType   @default(FOLLOW_UP)
  status          AppointmentStatus @default(PENDING)
  reason          String?
  patientNote     String?
  psyNote         String?           // nota clínica privada
  createdAt       DateTime          @default(now())
  @@index([psychologistId, startsAt])
  @@index([patientUserId, startsAt])
}

model Conversation {
  id          String   @id @default(cuid())
  isGroup     Boolean  @default(false)
  title       String?
  createdAt   DateTime @default(now())
  members     ConversationMember[]
  messages    Message[]
}

model ConversationMember { conversationId, userId, lastReadAt, role, joinedAt }

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  body           String
  createdAt      DateTime @default(now())
  attachmentUrl  String?
  readBy         MessageRead[]
}

model Workshop {
  id          String        @id @default(cuid())
  authorId    String        // user id del psicólogo
  title       String
  description String
  coverUrl    String?
  startsAt    DateTime
  durationHrs Float         @default(2)
  capacity    Int           @default(30)
  priceCents  Int           @default(0)
  area        WorkshopArea
  status      ContentStatus @default(PENDING)
  rejectReason String?
  enrollments WorkshopEnrollment[]
}

model WorkshopEnrollment { workshopId, userId, createdAt, @@unique([workshopId, userId]) }

model Resource {
  id           String        @id @default(cuid())
  authorId     String
  type         ResourceType
  title        String
  description  String
  coverUrl     String?
  fileUrl      String?
  readingMins  Int?
  area         WorkshopArea?
  status       ContentStatus @default(PENDING)
  rejectReason String?
}

model PatientReport {   // "Reportes de pacientes" de las notificaciones
  id            String   @id @default(cuid())
  psychologistId String
  patientUserId String
  summary       String
  moodScore     Int?
  createdAt     DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  kind      String
  title     String
  body      String
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt])
}

model NotificationPreference {
  userId        String  @id
  newAppointments Boolean @default(true)
  newMessages     Boolean @default(true)
  patientReports  Boolean @default(true)
  moodAlerts      Boolean @default(true)
  platformNews    Boolean @default(false)
}

model PsyReferral {
  id               String         @id @default(cuid())
  fromPsychologistId String
  toPsychologistId String
  patientUserId    String
  status           ReferralStatus @default(PENDING)
  note             String?
  createdAt        DateTime       @default(now())
}

model Review {
  id       String @id @default(cuid())
  psyId    String
  userId   String
  rating   Int
  comment  String?
  @@unique([psyId, userId])   // o unique por sesión, según decisión
}
```

Modelos de usuario que faltan y este módulo consume: `Habit` y `MoodEntry` (estado
emocional que el psicólogo ve). Los define el worktree de usuario; este worktree debe
consumirlos sin redefinirlos.

---

## 8. API propuesta

Todas bajo `/api/psy`, con `requireAuth` + `requireRole('PSYCHOLOGIST')` + un guard
de estado (aprobado / activo) reutilizable.

```
GET    /api/psy/dashboard                 → tarjetas + próxima sesión + pacientes recientes
GET    /api/psy/patients                  ?search&status&page&limit
GET    /api/psy/patients/:userId          → ficha, historial, notas
PATCH  /api/psy/patients/:userId/notes

GET    /api/psy/appointments              ?scope=today|upcoming|past&status
PATCH  /api/psy/appointments/:id          → status, psyNote

GET    /api/psy/conversations             ?filter=all|unread|groups
GET    /api/psy/conversations/:id/messages
POST   /api/psy/conversations/:id/messages
POST   /api/psy/conversations             → crear grupo
POST   /api/psy/conversations/:id/block
POST   /api/psy/conversations/:id/report

GET    /api/psy/workshops                 ?search&area&status&page&limit
POST   /api/psy/workshops
GET    /api/psy/workshops/:id
PATCH  /api/psy/workshops/:id
GET    /api/psy/workshops/:id/enrollments

GET    /api/psy/resources                 ?type&search&status&page&limit
POST   /api/psy/resources
GET    /api/psy/resources/:id
PATCH  /api/psy/resources/:id

GET    /api/psy/profile
PATCH  /api/psy/profile                   → bio, especialidades, tarifa, disponibilidad
PUT    /api/psy/profile/availability      → horarios semanales
GET    /api/psy/notifications
POST   /api/psy/notifications/read-all
GET    /api/psy/preferences
PATCH  /api/psy/preferences
```

Extensión del panel admin (mínimo indispensable):
```
GET    /api/admin/psy-content?type=workshop|resource&status=PENDING
PATCH  /api/admin/psy-content/:type/:id/status   → APPROVED | REJECTED (+ motivo)
```

Errores: validación `zod` → 400; sin sesión → 401; rol o vínculo insuficiente → 403;
recurso ajeno → 404 (no revelar existencia).

---

## 9. Frontend propuesto

```
/psy                                  PsyLayout (ProtectedRoute + PsyRoute)
  /psy                  → PsyDashboardPage     "Panel de seguimiento emocional"
  /psy/sesiones/hoy     → PsyTodaySessionsPage
  /psy/sesiones         → PsyUpcomingSessionsPage
  /psy/pacientes        → PsyPatientsPage
  /psy/pacientes/:id    → PsyPatientDetailPage
  /psy/talleres         → PsyWorkshopsPage
  /psy/talleres/nuevo   → PsyWorkshopCreatePage
  /psy/talleres/:id     → PsyWorkshopDetailPage
  /psy/talleres/:id/inscriptos → PsyWorkshopAttendeesPage
  /psy/recursos         → PsyResourcesPage
  /psy/recursos/nuevo   → PsyResourceCreatePage
  /psy/recursos/:id     → PsyResourceDetailPage
  /psy/mensajes         → PsyChatsPage
  /psy/mensajes/:id     → PsyChatDetailPage
  /psy/notificaciones   → PsyNotificationsPage
  /psy/configuracion    → PsySettingsPage
  /psy/configuracion/…  → perfil, contraseña, correo, teléfono, eliminar cuenta,
                          especialidades, tarifa, horarios
  /psy/perfil           → PsyPublicProfilePage (vista Psy 5)
```

Piezas nuevas:
- `frontend/src/components/PsyRoute.tsx` — exige `role === 'PSYCHOLOGIST'`, en modo
  estricto exige además aprobación; si no, redirige a `/psy/pendiente`.
- `frontend/src/layouts/PsyLayout.tsx` — sidebar exacto del mockup:
  **Inicio, Talleres, Recursos, Mensajes, Configuración** + tarjeta de usuario +
  "Cerrar sesión".
- `frontend/src/components/PsySidebar.tsx`
- Redirección por rol en `LoginPage` y en `ProtectedRoute`.

Notas de alcance: `/dashboard`, `/mfa/*` se mantienen tal cual. Solo cambian
`App.tsx` y `LoginPage.tsx`, para la redirección por rol.

---

## 10. Estado de implementación

Fases 1–9 completadas en este worktree. Verde: `backend` 68 tests,
`frontend` 38 tests, `typecheck` y `build` en ambos paquetes.

### 10.1 Backend

- `backend/prisma/schema.prisma` — 14 modelos nuevos (`AvailabilitySlot`, `PsyPatient`,
  `Appointment`, `Conversation`, `ConversationMember`, `Message`, `MessageRead`,
  `Workshop`, `WorkshopEnrollment`, `Resource`, `PatientReport`, `Notification`,
  `NotificationPreference`, `PsyReferral`, `Review`) + 7 enums.
- `backend/prisma/migrations/20260930010000_psy_module/migration.sql` — migración generada
  con `prisma migrate diff` (aún no aplicada: requiere `DATABASE_URL` de Supabase).
- `backend/prisma/migrations/migration_lock.toml` — faltaba en el repositorio; creado.
- `backend/src/middleware/requireApprovedPsychologist.ts` — guard de rol **y** estado.
  Devuelve códigos estables: `ACCOUNT_SUSPENDED`, `PSY_PROFILE_MISSING`, `PSY_NOT_APPROVED`.
- `backend/src/services/psy/` — `shared`, `dashboard`, `appointments`, `workshops`,
  `resources`, `profile`, `messaging`, `notifications`, `referrals`.
- `backend/src/routes/psy.ts` — router `/api/psy` con
  `requireAuth` + `requireRole('PSYCHOLOGIST')` + `requireApprovedPsychologist()`.
- `backend/src/routes/admin.ts` — endpoints de moderación:
  - `GET /api/admin/psy-content?type=workshop|resource&status=…`
  - `PATCH /api/admin/psy-content/:type/:id/status`
  - `PATCH /api/admin/psychologists/:id/verify`
  - `PATCH /api/admin/psychologists/:id/approve` ahora activa la cuenta, guarda
    `approvedAt`/`approvedBy` y notifica al psicólogo.

### 10.2 Frontend

- `frontend/src/lib/roles.ts` — `roleHome`, `homeForRole`, `roleFromSupabaseUser`
  (lee solo `app_metadata.role`). Redirección por rol en `LoginPage`, `main.tsx`
  y `MfaVerifyPage`.
- `frontend/src/components/PsyRoute.tsx` — guard de rol; los no aprobados entran igual
  porque el estado se resuelve en el layout.
- `frontend/src/layouts/PsyLayout.tsx` — sidebar mockup (Inicio, Talleres, Recursos,
  Mensajes, Configuración), subnavegación, banner de pendiente de aprobación y de
  cuenta suspendida.
- `frontend/src/components/PsySidebar.tsx`
- `frontend/src/components/psy/PsyUi.tsx` — `StatusChip`, `EmptyState`, `LoadingBlock`,
  `ErrorBlock`, `StatCard`, `Panel`.
- `frontend/src/hooks/useAsync.ts` — ciclo de vida de requests por página.
- `frontend/src/lib/api.ts` — tipos y funciones de `/api/psy` + `ApiError` con
  `status` y `code`.
- `frontend/src/utils/format.ts` — fechas y moneda en es-CO.
- 14 páginas en `frontend/src/pages/psy/`.
- Rutas registradas en `frontend/src/App.tsx` bajo `/psy`.
- `frontend/src/content/siteContent.ts` — `psySidebarItems`, `psySecondaryItems` y
  diccionarios de etiquetas.
- `frontend/src/styles/global.css` — bloque de estilos del área del psicólogo.

### 10.3 Pendiente

- Aplicar la migración en Supabase (requiere `DATABASE_URL`).
- UI de moderación en el panel admin (`/admin/talleres`, `/admin/recursos`): el backend ya
  expone los endpoints, la pantalla admin todavía no existe.
- Lado del usuario: agenda de citas desde el directorio público, aceptación de derivaciones,
  valoración al psicólogo y registro de `MoodEntry` (del worktree de usuario). El campo
  `mood` ya está en el contrato de la API como `SIN_DATOS`.
- Formularios de cambio de contraseña / correo / teléfono / eliminación de cuenta usan
  Supabase y aún no tienen pantalla propia.

---

## 11. Roadmap de implementación

| Fase | Alcance | Dependencias | Estado |
|---|---|---|---|
| 0 | Decisiones de §6 resueltas | — | Hecha |
| 1 | Schema Prisma del módulo + migración SQL | Fase 0 | Hecha |
| 2 | `requireRole('PSYCHOLOGIST')` en producción, `PsyRoute`, redirección por rol | Fase 1 | Hecha |
| 3 | Backend: perfil profesional, disponibilidad, notificaciones, preferencias | Fase 1 | Hecha |
| 4 | Backend: pacientes + citas | Fase 0 (vínculo) | Hecha |
| 5 | Backend: talleres y recursos (crear/listar/detalle/inscriptos) | Fase 1 | Hecha |
| 6 | Backend: mensajería | Fase 1 | Hecha |
| 7 | Frontend: `PsyLayout` + sidebar + rutas | Fase 2 | Hecha |
| 8 | Frontend: dashboard, perfil, configuración | Fase 3 | Hecha |
| 9 | Frontend: talleres y recursos | Fase 5 | Hecha |
| 10 | Frontend: pacientes, citas, derivaciones | Fase 4 | Hecha |
| 11 | Frontend: mensajería y notificaciones | Fase 6 | Hecha |
| 12 | Backend de moderación admin | Fase 5 | Hecha (API) |
| 12b | Pantallas de moderación en `/admin` | Fase 12 | Pendiente |
| 13 | Pruebas backend y frontend, `typecheck`, `build` | Todas | Hecha |
| 14 | Lado del usuario: agendar cita, aceptar derivación, valorar | Fase 4 | Pendiente (otro worktree) |
| 15 | Aplicar migración en Supabase | Fase 1 | Pendiente (requiere `DATABASE_URL`) |

Criterio de calidad: `cd backend && npm run typecheck && npm run test && npm run build` y
`cd frontend && npm run typecheck && npm run test && npm run build` en verde.

---

## 13. Riesgos

- **Alcance:** el módulo son 27 pantallas. Lo entregado cubre el 100% del lado del
  psicólogo; falta el lado del usuario y la moderación visual del admin.
- **Datos clínicos:** `psyNote` y `PatientReport` son datos sensibles. Están fuera de
  todo endpoint accesible al paciente, pero **no hay auditoría de accesos**: registrar
  quién leyó qué nota es un trabajo pendiente de seguridad.
- **Constraint D2 en base de datos:** "un solo psicólogo activo" se valida en el servicio,
  no con un índice parcial de Postgres. Dos confirmaciones concurrentes podrían dejar dos
  vínculos `ACTIVE`. Requiere un `CREATE UNIQUE INDEX ... WHERE status = 'ACTIVE'` escrito
  a mano en la migración cuando se aplique.
- **Mocks duplicados:** existen `AdminPsychologistsPage 2.tsx` y
  `AdminDashboardPage 2.tsx` en el repo. No replicar ese patrón.
- **Dependencia de otros worktrees:** `Habit` y `MoodEntry` (estado emocional) los
  define el módulo de usuario. Este worktree expone `mood: 'SIN_DATOS'` y consume
  el modelo cuando exista.
- **RLS:** `backend/supabase/migrations/rls.sql` aún no se ha aplicado. Los nuevos
  modelos están diseñados para que el backend (service key) sea el único acceso directo.
