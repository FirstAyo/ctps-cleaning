#!/usr/bin/env sh
set -eu
umask 077

storage_root="${MEDIA_BACKUP_SOURCE:-./storage}"
backup_root="${BACKUP_ROOT:-./backups}"
if [ ! -d "$storage_root/public" ] || [ ! -d "$storage_root/private" ]; then
  echo "MEDIA_BACKUP_SOURCE must contain public and private directories." >&2
  exit 1
fi
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_root/media"
destination="$backup_root/media/ctps-media-$timestamp.tar.gz"
tar --exclude='*.tmp' --exclude='.ctps-health-*.tmp' -C "$storage_root" -czf "$destination" public private
gzip -t "$destination"
sha256sum "$destination" >"$destination.sha256"
chmod 600 "$destination" "$destination.sha256"
echo "Media backup verified: $(basename "$destination")"
