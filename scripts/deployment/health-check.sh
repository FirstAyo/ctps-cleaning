#!/usr/bin/env sh
set -eu
api_url="${SMOKE_API_URL:-http://127.0.0.1:4000}"
curl --fail --silent --show-error --max-time 10 "$api_url/health" >/dev/null
curl --fail --silent --show-error --max-time 10 "$api_url/health/ready" >/dev/null
echo "API liveness and readiness passed."
