# VPS Deployment Plan

## Purpose

This is a future deployment plan, not infrastructure implementation. It preserves portability to a standard Linux VPS.

## Planned topology

Nginx terminates HTTPS and routes public, admin, and API traffic to Docker services on a private network. PostgreSQL is not publicly exposed. Persistent volumes hold database and, initially if approved, separate public/private media. SMTP-compatible delivery is provider-neutral. Production and local development must not require Vercel.

## Image and configuration guidance

Use reproducible multi-stage images, pinned supported runtimes, non-root processes, health checks, read-only filesystems where practical, and minimal build contexts. Supply validated environment configuration at runtime; separate public settings from secrets. Do not bake secrets or production data into images.

## Release sequence

1. Verify backups and restore readiness.
2. Build, scan, and identify immutable image versions.
3. Validate environment and database compatibility.
4. Apply safe forward-compatible migrations through a controlled one-off process.
5. Start/replace services, wait for health/readiness, and run smoke checks.
6. Verify public/admin/API behavior, logs, email, storage, and monitoring.
7. Roll back application images when safe; prefer corrective forward migrations when schemas changed.

Exact zero-downtime strategy depends on VPS capacity and migration design.

## Nginx and network concerns

Plan host routing, trusted forwarded headers, request/body limits (especially uploads), timeouts, compression, caching for immutable public assets, no caching for private/customer responses, WebSocket needs if any, security headers, access-log privacy, and automated certificate renewal. Only 80/443 should normally be public.

## Backups and recovery

Back up PostgreSQL and public/private media off-host with encryption and versioned retention. Automate integrity checks and regularly restore into an isolated environment. Document data recovery, complete VPS loss, compromised credentials, failed migration, certificate failure, and storage migration. RPO/RTO and retention are unresolved.

## Operations

Monitor availability, health, errors, resource saturation, disk/database growth, certificate expiry, backup success, mail failures, and suspicious auth/rate-limit activity. Central logging and alert provider remain choices. Keep deployment/runbook access least-privileged.

## Future scaling

Possible later steps include separate database/storage hosts, S3-compatible media, background workers, multiple stateless app replicas, managed SMTP, and external monitoring. Adopt them only from measured needs.
