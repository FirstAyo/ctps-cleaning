# Infrastructure

Production infrastructure is intentionally deferred beyond Phase 1. This directory contains no
Nginx, TLS, deployment, backup, monitoring, or production container configuration.

Phase 1 uses only the root `docker-compose.yml` PostgreSQL service for local development. Future
infrastructure must follow `docs/deployment-plan.md` and preserve standard Linux VPS portability.
