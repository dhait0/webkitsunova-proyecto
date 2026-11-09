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

### Recuperación
1. Detener el tráfico de escritura (o aceptar la ventana).
2. `public`: `pg_restore --clean --if-exists --no-owner -d "$DIRECT_URL" prod-edbt-<fecha>.dump`.
3. `auth` (cuentas, identidades y factores MFA; las sesiones se pierden y cada persona vuelve a iniciar sesión):
   ```
   psql "$DIRECT_URL" -c "delete from auth.users;"
   for t in users identities mfa_factors mfa_recovery_code_sets mfa_recovery_codes; do
     pg_restore --data-only -n auth -t $t -d "$DIRECT_URL" prod-edbt-AUTH-<fecha>.dump
   done
   ```
   El orden importa (`identities` y `mfa_*` dependen de `users`). **No** usar `--disable-triggers` (exige ser dueño de las tablas) ni restaurar `sessions`, `refresh_tokens`, `audit_log_entries` ni `schema_migrations` (permisos/dependencias; son efímeras o propias de GoTrue).
4. Comprobar recuentos contra el inventario (sección 2) y que un administrador real inicia sesión.

Ensayo de la restauración de `auth`: hecho sobre la pila local con datos sintéticos (7 cuentas): `users` 7, `identities` 7, las 7 cuentas inician sesión. Se descubrió que `--disable-triggers` y la restauración en una sola pasada fallan; el procedimiento anterior es el validado. **No se ha ensayado con el volcado real de producción** (no se copian cuentas reales a local).

## 4. Orden de ejecución recomendado (cada paso exige autorización)
1. **Autorización A — migraciones:** `supabase db push --db-url "$DIRECT_URL"` (pooler en modo sesión, puerto 5432), según `PROD_MIGRACION_HABITOS_RUNBOOK.md`. Aplica solo las dos pendientes.
2. Fusionar el PR #44 a `main` (el workflow `deploy-migrations` no tendrá nada que aplicar) y esperar el despliegue de Vercel.
3. Verificar con un usuario real: `/dashboard`, `/dashboard/habitos`, `/dashboard/citas`, `/psy`, `/admin`.
4. Decidir qué cuentas conservar (`DEMO_KEEP_EMAILS`).
5. **Autorización B — reemplazo:** tomar respaldos frescos (público y Auth) y ejecutar
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

## 6. Ensayo realizado (pila local desechable, dataset sintético equivalente en forma)
17 usuarios Prisma (2 ADMIN, 5 PSYCHOLOGIST, 10 USER), 21 de Auth (4 huérfanos), citas, 6 conversaciones (una sin miembros), hábitos con registros, un taller y notificaciones; una cuenta preservada con su conversación y notificación.
- Dry run: inventario correcto, nada modificado.
- `--apply` con una cuenta preservada: 16 usuarios, 5 conversaciones y 20 usuarios de Auth eliminados; la cuenta preservada y sus datos intactos; las siete cuentas demo inician sesión.
- `--apply` sin cuentas preservadas: estado final exacto: 1 ADMIN, 3 PSYCHOLOGIST aprobados, 3 USER; 12 citas, 15 franjas, 4 vínculos, 3 conversaciones (9 mensajes), 9 hábitos con 144 registros, 3 talleres con 5 inscripciones, 3 recursos, 3 reseñas, 4 reportes, 7 notificaciones; 0 huérfanos en Auth o Prisma; RLS 21/21; un solo vínculo ACTIVE por usuario.
- Rechazos del guardia verificados: sin referencia, sin confirmación, con confirmación errónea, y el seed directo contra `.env` remoto.

## 7. Verificaciones posteriores
- Recuentos del escenario (sección 6) y `0` usuarios huérfanos en ambos sentidos.
- Inicio de sesión de las siete cuentas (el script lo hace al terminar) y de las cuentas conservadas.
- `GET /rest/v1/User` con la clave publicable → 401.
- Recorrido en navegador de USER, PSYCHOLOGIST y ADMIN; `/dashboard` sin error #441.

## 8. Riesgos
- Operación **destructiva e irreversible sin respaldo**: la recuperación de `auth` está ensayada solo con datos sintéticos, no con el volcado real.
- Las cuentas de demostración comparten contraseña: usar una larga y única, y retirar las cuentas demo si el proyecto se usa con personas reales.
- Si se pierde el acceso de administrador real, solo queda la cuenta demo.
- No se ha podido verificar la configuración de variables de Vercel.
