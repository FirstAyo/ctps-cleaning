#!/usr/bin/env sh
set -eu

if [ "${1:-}" != "--confirm-isolated-restore" ] || [ -z "${2:-}" ]; then
  echo "Usage: restore-database.sh --confirm-isolated-restore BACKUP.dump" >&2
  exit 2
fi
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required and must target an isolated database}"
if [ -n "${DATABASE_URL:-}" ] && [ "$RESTORE_DATABASE_URL" = "$DATABASE_URL" ]; then
  echo "Refusing to restore into DATABASE_URL. Use a separate isolated database." >&2
  exit 1
fi
backup="$2"
if [ ! -f "$backup" ] || [ ! -f "$backup.sha256" ]; then
  echo "Backup and adjacent checksum file are required." >&2
  exit 1
fi
(cd "$(dirname "$backup")" && sha256sum -c "$(basename "$backup").sha256")
pg_restore --list "$backup" >/dev/null
pg_restore --exit-on-error --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE_URL" "$backup"
echo "Isolated database restore completed; application verification is still required."
