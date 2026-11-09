# Migración de producción: tabla `Habit` y RLS

Estado: **preparado, no ejecutado**. Nada de esto se ha aplicado a producción.

## Diagnóstico (verificado, solo lectura)
- Proyecto Supabase de producción: `edbtowdipfeskqdmngji`. Es el que usa el JavaScript público de `webkitsunova.parzkeys.com` y el `.env` local.
- Historial remoto (`supabase_migrations.schema_migrations`): `20240101000000`, `20240101000001`. Falta `20240101000002_habits_module.sql`.
- La tabla `"Habit"` no existe en el remoto; `/dashboard` la consulta y falla (React #441).
- El workflow `deploy-migrations` falló el 2026-10-26 con `tenant/user postgres.qwijohugyovepcgrvhlt not found`: el secreto `PROD_DATABASE_URL` apunta a un proyecto distinto (`qwijohugyovepcgrvhlt`).
- Las 19 tablas públicas tienen RLS desactivado y 0 políticas. Con la clave publicable, `/rest/v1/User` responde (23 filas): **el Data API de Supabase expone las tablas**. La aplicación solo usa Prisma, no PostgREST, así que cerrarlo no afecta a la app.

## Migraciones a aplicar (en este orden, con `supabase db push`)
1. `20240101000002_habits_module.sql`: `CREATE TABLE "Habit"` + índice + FK a `"User"` con `ON DELETE CASCADE`. No toca tablas ni datos existentes.
2. `20261109000000_enable_rls_public_tables.sql`: `ENABLE ROW LEVEL SECURITY` y `REVOKE ALL ... FROM anon, authenticated` en las 20 tablas. Prisma conecta con un rol que ignora RLS.

Prueba previa (base local desechable en el estado del remoto, 19 tablas, con filas de ejemplo): las dos migraciones se aplican sin error; el número y el hash de las filas de `"User"` no cambian; `anon` y `authenticated` reciben `permission denied`; el rol `postgres` inserta y lee `"Habit"`; el borrado en cascada funciona; reaplicar la 000002 falla con `already exists` (no es idempotente: no repetir).

## Antes de ejecutar (estado a 2026-11-09)
1. **Secretos de GitHub corregidos**: `PROD_DATABASE_URL` y `PROD_DIRECT_URL` apuntan ahora a `edbtowdipfeskqdmngji`, por el pooler en modo sesión (puerto 5432; el modo transacción, 6543, no sirve para DDL). Los valores no se imprimieron ni se guardaron en el repositorio.
2. **Respaldo realizado**: `pg_dump -Fc` de los esquemas `public` y `supabase_migrations`, guardado fuera del repositorio en `~/kitsunova-backups/` (directorio 700, archivo 600). Restauración verificada en una base desechable: los recuentos por tabla coinciden con el remoto (User 23, Profile 23, Appointment 5, AvailabilitySlot 25, ...). **No incluye el esquema `auth`**: las migraciones no lo tocan, pero conviene además un respaldo desde el panel de Supabase (Database → Backups).
3. Recuento de referencia: `"User"` = 23, 19 tablas públicas.
4. Prisma conecta como `postgres` con `BYPASSRLS`: RLS no le afecta. La aplicación solo usa Supabase para autenticación (`auth.*`); no hay `.from()`, `.rpc()`, Storage ni Realtime. Consumidores externos de la clave publicable: no se pueden descartar desde el repositorio; comprobar en el panel de Supabase (API logs) antes de aplicar.

## Ejecución
```
supabase migration list --db-url "$DIRECT_URL"   # debe mostrar 000000 y 000001 aplicadas
supabase db push --db-url "$DIRECT_URL" --dry-run # debe listar solo las dos migraciones nuevas
supabase db push --db-url "$DIRECT_URL"
```
Si se ejecuta por GitHub Actions, el workflow se dispara con un push a `main` que toque `supabase/migrations/**`.

## Verificación posterior
- `"Habit"` existe y las 20 tablas tienen `rowsecurity = true`.
- `select count(*) from "User"` sigue igual.
- `GET /rest/v1/User` con la clave publicable devuelve error de permisos, no filas.
- Iniciar sesión como usuario normal: `/dashboard` carga sin #441 y `/dashboard/habitos` permite crear un hábito.

## Recuperación
- `Habit` es nueva y está vacía: revertir es `DROP TABLE "Habit";` (solo si no hay hábitos que conservar).
- RLS: `ALTER TABLE "<tabla>" DISABLE ROW LEVEL SECURITY;` y `GRANT ALL ON TABLE "<tabla>" TO anon, authenticated;` (esto reabre el Data API; solo si algo lo exigiera, que no es el caso de la app actual).
- Si algo más falla, restaurar desde el respaldo del paso previo.
- Tras revertir manualmente, borrar la fila correspondiente de `supabase_migrations.schema_migrations` para que la migración vuelva a considerarse pendiente.
