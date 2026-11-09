#!/usr/bin/env bash
# Rebuilds the application database of a LOCAL Kitsunova Supabase stack:
# deletes its Auth users, recreates the public schema and replays every file in
# supabase/migrations in order. Destructive on purpose, so it refuses anything
# that is not an explicitly named local Kitsunova container.
#
#   LOCAL_DB_CONTAINER=supabase_db_<project> scripts/reset-local-db.sh
set -euo pipefail

container="${LOCAL_DB_CONTAINER:-}"
root="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "$container" ]]; then
  echo "Set LOCAL_DB_CONTAINER to the Supabase DB container of the local Kitsunova stack." >&2
  exit 1
fi

if [[ "$container" != supabase_db_* || "$container" != *kitsunova* ]]; then
  echo "Refusing '$container': only supabase_db_*kitsunova* containers are allowed." >&2
  exit 1
fi

if ! docker inspect "$container" >/dev/null 2>&1; then
  echo "Container '$container' does not exist." >&2
  exit 1
fi

# The published port must be bound to this machine only.
published="$(docker port "$container" 5432/tcp | head -1)"
case "$published" in
  0.0.0.0:*|127.0.0.1:*|\[::\]:*) ;;
  *) echo "Unexpected port mapping: $published" >&2; exit 1 ;;
esac

psql_in() { docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

echo "Target: container=$container port=$published"
psql_in -c "select 'database=' || current_database() || ' server_version=' || current_setting('server_version')" -At

psql_in <<'SQL'
delete from auth.users;
drop schema public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
SQL

for file in "$root"/supabase/migrations/*.sql; do
  echo "Applying $(basename "$file")"
  psql_in < "$file"
done

echo "Public tables: $(psql_in -At -c "select count(*) from pg_tables where schemaname='public'")"
echo "Auth users:    $(psql_in -At -c "select count(*) from auth.users")"
