#!/usr/bin/env bash
# Restores application data and Auth accounts from the backups taken before a
# replacement (pg_dump -Fc of `public` + `supabase_migrations`, and of `auth`).
#
# It keeps the schema, RLS and grants: it EMPTIES the tables and loads rows only,
# in foreign-key order, without disabling triggers (a hosted `postgres` role is
# not a superuser). Auth sessions are not restored; people sign in again.
#
#   RESTORE_DB_URL=<direct or session-pooler URL>  RESTORE_CONFIRM=<phrase> \
#   RESTORE_PUBLIC_DUMP=<file> RESTORE_AUTH_DUMP=<file> scripts/restore-from-backup.sh
#
# RESTORE_CONFIRM must be "RESTORE-LOCAL" for a localhost URL, or
# "RESTORE-<project ref>" for a Supabase project (the ref must appear in the URL).
set -euo pipefail

url="${RESTORE_DB_URL:-}"
pub="${RESTORE_PUBLIC_DUMP:-}"
auth="${RESTORE_AUTH_DUMP:-}"
confirm="${RESTORE_CONFIRM:-}"

for f in "$pub" "$auth"; do
  [[ -s "$f" ]] || { echo "Backup file missing or empty: '$f'" >&2; exit 1; }
done
[[ -n "$url" ]] || { echo "Set RESTORE_DB_URL." >&2; exit 1; }

if [[ "$url" == *"@127.0.0.1"* || "$url" == *"@localhost"* ]]; then
  [[ "$confirm" == "RESTORE-LOCAL" ]] || { echo "Local restore needs RESTORE_CONFIRM=RESTORE-LOCAL." >&2; exit 1; }
else
  ref="$(printf '%s' "$url" | grep -oE '[a-z0-9]{20}' | head -1 || true)"
  [[ -n "$ref" && "$confirm" == "RESTORE-$ref" ]] || { echo "Remote restore needs RESTORE_CONFIRM=RESTORE-<project ref found in the URL>." >&2; exit 1; }
fi

# psql/pg_restore run where the client tools are: set PSQL/PG_RESTORE to wrappers
# (for example `docker exec -i <container> psql ...`) when they are not installed.
PSQL="${PSQL:-psql}"
PG_RESTORE="${PG_RESTORE:-pg_restore}"

# Parents before children.
PUBLIC_ORDER=(User Profile PsychologistProfile AvailabilitySlot Session PsyPatient Appointment Conversation
  ConversationMember Message MessageRead Notification NotificationPreference PatientReport PsyReferral Resource
  Review Workshop WorkshopEnrollment Habit HabitLog)

echo "1/4 Clearing application tables"
quoted=$(printf '"%s",' "${PUBLIC_ORDER[@]}"); quoted="${quoted%,}"
$PSQL "$url" -v ON_ERROR_STOP=1 -q -c "truncate table $quoted restart identity cascade" 2>&1 \
  | grep -v 'does not exist, skipping' || true

echo "2/4 Restoring application data"
available="$($PG_RESTORE -l "$pub" | awk '/TABLE DATA public /{print $7}')"
for t in "${PUBLIC_ORDER[@]}"; do
  if grep -qx "$t" <<<"$available"; then
    # pg_restore -t matches the name literally: mixed-case names need no quoting.
    $PG_RESTORE --data-only -n public -t "$t" -d "$url" "$pub"
  fi
done

echo "3/4 Clearing Auth accounts"
$PSQL "$url" -v ON_ERROR_STOP=1 -q -c "delete from auth.users"

echo "4/4 Restoring Auth accounts (users first)"
for t in users identities mfa_factors mfa_recovery_code_sets mfa_recovery_codes; do
  $PG_RESTORE --data-only -n auth -t "$t" -d "$url" "$auth"
done

echo "Done. Verify counts and sign in with an administrator."
