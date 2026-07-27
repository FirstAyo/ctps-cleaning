# Infrastructure

Phase 10 adds the portable Nginx/TLS reverse-proxy foundation used by `compose.production.yml`.
Application Dockerfiles remain in their application directories; backup, restore, smoke, and
deployment helpers live under `scripts/deployment`. Real certificates, environment files, DNS,
host firewall, SSH, monitoring credentials, and runtime media are deliberately not committed.

The root `docker-compose.yml` remains the PostgreSQL-only development workflow. Follow
`docs/deployment-runbook.md`, `docs/security-hardening.md`, and `docs/backup-and-recovery.md` before
operating the production topology.
