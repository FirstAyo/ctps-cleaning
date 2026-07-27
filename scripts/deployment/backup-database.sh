#!/usr/bin/env sh
set -eu
umask 077

: "${DATABASE_URL:?DATABASE_URL is required}"
backup_root="${BACKUP_ROOT:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_root/database"
destination="$backup_root/database/ctps-$timestamp.dump"
if [ -e "$destination" ]; then
  echo "Backup destination already exists." >&2
  exit 1
fi
pg_dump --dbname="$DATABASE_URL" --format=custom --compress=9 --file="$destination"
pg_restore --list "$destination" >/dev/null
sha256sum "$destination" >"$destination.sha256"
chmod 600 "$destination" "$destination.sha256"
echo "Database backup verified: $(basename "$destination")"
