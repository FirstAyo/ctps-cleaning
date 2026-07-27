#!/usr/bin/env sh
set -eu

if [ "${1:-}" != "--confirm-isolated-restore" ] || [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
  echo "Usage: restore-media.sh --confirm-isolated-restore BACKUP.tar.gz EMPTY_TARGET" >&2
  exit 2
fi
backup="$2"
target="$3"
if [ ! -f "$backup" ] || [ ! -f "$backup.sha256" ]; then
  echo "Backup and adjacent checksum file are required." >&2
  exit 1
fi
if [ "$target" = "/" ] || [ -z "$target" ]; then
  echo "Unsafe restore target." >&2
  exit 1
fi
mkdir -p "$target"
if [ -n "$(find "$target" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  echo "Restore target must be empty." >&2
  exit 1
fi
(cd "$(dirname "$backup")" && sha256sum -c "$(basename "$backup").sha256")
gzip -t "$backup"
tar -xzf "$backup" -C "$target"
echo "Isolated media restore completed; ownership and access controls must now be verified."
