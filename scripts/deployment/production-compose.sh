#!/usr/bin/env sh
set -eu
action="${1:-}"
case "$action" in
  build) docker compose -f compose.production.yml build ;;
  start) docker compose -f compose.production.yml up -d ;;
  stop) docker compose -f compose.production.yml down ;;
  status) docker compose -f compose.production.yml ps ;;
  migrate) docker compose -f compose.production.yml --profile tools run --rm migrate ;;
  *) echo "Usage: production-compose.sh {build|start|stop|status|migrate}" >&2; exit 2 ;;
esac
