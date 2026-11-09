# Paso a producción del Sprint 1 y reemplazo por el escenario de demostración

Estado: **preparado y ensayado en una base local desechable; nada de esto se ha ejecutado en producción.**
Proyecto objetivo: `edbtowdipfeskqdmngji`.

## 1. Migraciones pendientes (verificado con `migration list` y `db push --dry-run`)
| Versión | Efecto |
|---|---|
| `20261110000000_habit_tracking` | `Habit.targetPerWeek` + tabla `HabitLog` (única por hábito y día, RLS, permisos revocados) |
| `20261110000100_psychologist_rejection` | `PsychologistProfile.rejectedAt` |

Son las únicas pendientes. Probadas sobre una copia restaurada del respaldo de producción: recuentos idénticos, sin pérdida de filas.

## 2. Inventario de lo que el reemplazo sustituiría (lectura, `--dry-run` remoto del 2026-11-09)
- Usuarios Prisma: **23** (2 ADMIN, 6 PSYCHOLOGIST, 15 USER). Usuarios de Auth: **27** (4 sin fila en Prisma).
- Datos que caen en cascada: 5 citas, 25 franjas, 5 vínculos paciente-psicólogo, 4 conversaciones (8 mensajes) y los perfiles. Hábitos, talleres, recursos, reseñas, reportes, derivaciones y notificaciones: 0.
- **Incluye los dos administradores reales.** El escenario crea `admin.demo@kitsunova.local`; si se reemplazan los dos reales, solo se podrá entrar con la cuenta demo. Para conservar cuentas (y sus datos) usar `DEMO_KEEP_EMAILS=correo1,correo2`.

## 3. Respaldo (en `~/kitsunova-backups/`, permisos 600, fuera del repositorio)
| Archivo | Contenido | Restaura |
|---|---|---|
| `prod-edbt-<fecha>.dump` | esquemas `public` y `supabase_migrations` (estructura y datos) | datos de la aplicación (verificado: restaurado en base desechable con recuentos idénticos) |
| `prod-edbt-AUTH-<fecha>.dump` | esquema `auth` completo (27 tablas con datos: `users`, `identities`, `sessions`, `mfa_*`…). **Contiene hashes de contraseña: no compartir.** | cuentas, identidades y factores MFA |

Antes de `--apply` hay que tomar **ambos** de nuevo si tienen más de 24 horas (el script lo exige). No incluyen la configuración del proyecto Supabase (plantillas de correo, SMTP, URL de redirección, proveedores): no la toca ningún paso de este procedimiento. Además conviene un respaldo desde el panel (Database → Backups).

### Recuperación (script validado)
```
RESTORE_DB_URL="$DIRECT_URL" RESTORE_CONFIRM=RESTORE-edbtowdipfeskqdmngji \
RESTORE_PUBLIC_DUMP=<ruta public.dump> RESTORE_AUTH_DUMP=<ruta auth.dump> \
scripts/restore-from-backup.sh
```
Vacía las tablas de la aplicación y carga las filas en orden de claves foráneas **sin deshabilitar triggers** (el rol `postgres` de Supabase no es superusuario), borra los usuarios de Auth y restaura `users`, `identities`, `mfa_factors` y los códigos de recuperación. Conserva esquema, RLS y permisos. Las sesiones no se restauran: cada persona vuelve a iniciar sesión. Requiere `psql` y `pg_restore` (o `PSQL`/`PG_RESTORE` apuntando a un contenedor).

Salvaguardas: exige la frase `RESTORE-<ref>` presente en la URL (o `RESTORE-LOCAL` para localhost) y que ambos volcados existan.

**Hallazgos del ensayo:** `pg_restore --disable-triggers` falla (no se es dueño de las tablas de `auth`); restaurar `auth` en una pasada falla por el orden de las claves foráneas; `pg_restore -t` interpreta el nombre literalmente (no se debe entrecomillar `User`); `sessions`, `refresh_tokens`, `audit_log_entries` y `schema_migrations` no deben restaurarse.

## 4. Orden de ejecución recomendado (cada paso exige autorización)
1. **Autorización A — migraciones:** `supabase db push --db-url "$DIRECT_URL"` (pooler en modo sesión, puerto 5432), según `PROD_MIGRACION_HABITOS_RUNBOOK.md`. Aplica solo las dos pendientes.
2. Fusionar el PR #44 a `main` (el workflow `deploy-migrations` no tendrá nada que aplicar) y esperar el despliegue de Vercel.
3. Verificar con un usuario real: `/dashboard`, `/dashboard/habitos`, `/dashboard/citas`, `/psy`, `/admin`.
4. Decidir qué cuentas conservar (`DEMO_KEEP_EMAILS`).
5. **Autorización B — reemplazo:** tomar respaldos frescos (público y Auth) y ejecutar (añadir `DEMO_ACK_NO_PRESERVED_ADMIN=yes-replace-all-admins` solo si se decide reemplazar también a los administradores)
   ```
   DEMO_REMOTE_PROJECT_REF=edbtowdipfeskqdmngji \
   DEMO_REMOTE_CONFIRM=REPLACE-DEMO-DATA-edbtowdipfeskqdmngji \
   DEMO_REPLACE_BACKUP=<ruta .dump public> DEMO_REPLACE_AUTH_BACKUP=<ruta .dump auth> \
   DEMO_KEEP_EMAILS=<correos a conservar> DEMO_PASSWORD='<contraseña larga>' \
   npx tsx scripts/replace-with-demo-data.ts --apply
   ```
   con las variables de `.env` de producción cargadas (`NEXT_PUBLIC_SUPABASE_URL`, clave de servicio, `DATABASE_URL`). Sin `--apply` solo imprime el inventario.
6. Guardar la contraseña demo en un gestor (no en el repositorio).

## 5. Qué hace y qué no hace el reemplazo
- **Hace:** borra conversaciones, usuarios Prisma (cascada a todas las tablas dependientes) y usuarios de Auth que no estén en `DEMO_KEEP_EMAILS`; después siembra el escenario (ver `DEMO_ESCENARIO_LOCAL.md`).
- **No hace:** cambiar esquema, migraciones, RLS, permisos, secretos ni configuración de Supabase; no toca otros proyectos.
- **Salvaguardas:** destino remoto solo con `DEMO_REMOTE_PROJECT_REF` + confirmación exacta + API y base de datos del mismo proyecto; `--apply` remoto exige respaldos de menos de 24 h y las migraciones aplicadas; el seed ejecutado directamente sigue siendo solo local.

## 6. Ensayos realizados (pila local desechable)
**Volcado real de `auth` (restaurado en una base aislada y borrada después, sin servicios conectados):** 27 usuarios, 27 identidades (todas `email`), 27 con hash de contraseña, 21 con correo confirmado, **0 factores MFA** (no hay MFA que recuperar hoy), 0 identidades sin usuario, 0 usuarios sin identidad. Roles en `raw_app_meta_data`: ADMIN 2, PSYCHOLOGIST 6, USER 13, sin rol 6 (los 4 huérfanos y 2 más). El rol `postgres` de producción tiene INSERT/DELETE sobre `auth.users`, `auth.identities` y `auth.mfa_factors`, es dueño de las 20 tablas de `public` y no es superusuario (consulta de catálogo, solo lectura).

**Réplica representativa sintética (misma forma que producción: 23 usuarios — 2 ADMIN, 6 PSYCHOLOGIST, 15 USER —, 27 de Auth con 4 huérfanos, 25 franjas, 5 citas, 5 vínculos, 4 conversaciones, 8 mensajes y 1 factor MFA):**
1. Respaldos `public` y `auth` tomados con los mismos comandos que en producción.
2. `--apply` sin `DEMO_KEEP_EMAILS` ni confirmación de administradores: **rechazado**. Con `DEMO_ACK_NO_PRESERVED_ADMIN=yes-replace-all-admins`: 23 usuarios, 4 conversaciones y 27 usuarios de Auth eliminados; las siete cuentas demo inician sesión.
3. Resultado exacto: 1 ADMIN, 3 PSYCHOLOGIST aprobados, 3 USER; 12 citas, 15 franjas, 4 vínculos (uno ACTIVE por usuario), 3 conversaciones (9 mensajes), 9 hábitos con 144 registros, 3 talleres con 5 inscripciones, 3 recursos, 3 reseñas, 4 reportes, 7 notificaciones; 0 huérfanos; RLS 21/21; `anon` → 401.
4. El nuevo ADMIN, en navegador: ve las siete cuentas, abre el menú de acciones (editar, resetear contraseña, suspender, eliminar), lista a los tres psicólogos y renueva la verificación de uno.
5. **Recuperación completa** con `scripts/restore-from-backup.sh`: recuentos idénticos a los previos (23/27/27/1 MFA/5/25/5/5/4/8), mismos 4 huérfanos de Auth, RLS 21/21, sin permisos nuevos para `anon`, y 7 de 7 credenciales anteriores (hash de contraseña conservado, incluido el rol ADMIN en los claims) inician sesión.
6. Rechazos de las salvaguardas verificados: sin referencia, sin confirmación, confirmación errónea, seed directo contra `.env` remoto, restauración sin frase y con URL remota + frase local.

**Lo que NO se ha ensayado:** el borrado y la restauración contra el hosting real de Supabase (solo se comprobaron los privilegios por catálogo), ni la restauración con el volcado real fuera de la base aislada.

## 6bis. Garantía de acceso administrativo
1. **Recomendado: conservar al menos un administrador real** (`DEMO_KEEP_EMAILS`): el script se niega a continuar si no se conserva ninguno salvo reconocimiento explícito.
2. El nuevo ADMIN demo (`admin.demo@kitsunova.local`) se prueba al terminar; si falla el inicio de sesión de alguna cuenta el script sale con error y no hay que cerrar la sesión.
3. Mecanismos independientes de la aplicación: el panel de Supabase (propietario del proyecto) puede restablecer contraseñas y crear usuarios; el script de restauración devuelve las cuentas anteriores con sus contraseñas; el rol de servicio permite recrear un administrador por la API de administración.
4. Contraseña demo de producción: generada y guardada en `~/kitsunova-backups/demo-password-prod.txt` (permisos 600, fuera del repositorio, 32 caracteres). Usarla con `DEMO_PASSWORD="$(cat ~/kitsunova-backups/demo-password-prod.txt)"`.

## 6ter. Cuentas conservadas (`DEMO_KEEP_EMAILS`)
Antes de borrar, el script comprueba que cada cuenta conservada existe en Auth **y** en Prisma con el mismo id y está ACTIVE, y guarda una huella (ids, resumen del hash de contraseña y de los metadatos/rol, identidades, factores MFA y fila Prisma). Al terminar la vuelve a calcular y falla (código de salida 1) si algo cambió. Ensayado con un ADMIN con un factor MFA: sin cambios, y sigue iniciando sesión con su contraseña original.

## 7. Verificaciones posteriores
- Recuentos del escenario (sección 6) y `0` usuarios huérfanos en ambos sentidos.
- Inicio de sesión de las siete cuentas (el script lo hace al terminar) y de las cuentas conservadas.
- `GET /rest/v1/User` con la clave publicable → 401.
- Recorrido en navegador de USER, PSYCHOLOGIST y ADMIN; `/dashboard` sin error #441.

## 8. Riesgos
- Operación **destructiva**: la recuperación está ensayada de extremo a extremo con datos sintéticos de la misma forma, pero no contra el hosting real ni con el volcado real.
- Las cuentas de demostración comparten contraseña: usar una larga y única, y retirar las cuentas demo si el proyecto se usa con personas reales.
- Si se pierde el acceso de administrador real, solo queda la cuenta demo.
- No se ha podido verificar la configuración de variables de Vercel.
