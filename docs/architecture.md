# Architecture

## Purpose

This document separates confirmed platform constraints from recommendations, future options, and unresolved decisions. Nothing described here is implemented in Phase 0.

## Confirmed direction

The planned pnpm/Turborepo monorepo has `apps/web` (public Next.js), `apps/admin` (protected Next.js), `apps/api` (NestJS), and shared packages for database, UI, types, validation, permissions, pricing, email, config, and SEO. PostgreSQL is the system of record through Prisma. Docker Compose and Nginx support local/VPS topology. Email uses SMTP-compatible delivery. The architecture must not depend on Vercel, Supabase, Firebase, Netlify, or vendor-locked serverless services.

## Recommended boundaries

- **Public web:** presentation, public routing, SEO rendering, guest forms, and safe API consumption. Server Components by default.
- **Admin:** staff workflows and permission-aware presentation; it never substitutes UI visibility for authorization.
- **API:** trusted application boundary for validation, authentication, authorization, workflows, rate limits, audit events, and media access.
- **Database:** Prisma schema/migrations and persistence adapters. It does not own presentation or estimator algorithms.
- **Pricing:** pure, version-aware deterministic calculation engine; receives validated typed rules and produces range/breakdown results.
- **Permissions:** shared permission identifiers and policy types, while the API performs enforcement.
- **Media:** provider-neutral interface separating public assets from private uploads. Metadata belongs in PostgreSQL; bytes may begin on VPS volumes.
- **Email:** templates and provider-neutral SMTP delivery invoked asynchronously where reliability requires it.
- **SEO:** metadata, canonical, sitemap, robots, and structured-data utilities without fabricating content.

## Authentication and authorization

Staff-only authentication terminates at trusted server boundaries. A secure session is presented to web/admin and verified by the API. Authorization maps users through roles to permissions and applies resource ownership (such as author-owned posts). Choice of authentication/session library is unresolved. Initial Super Admin creation should use a protected CLI/setup procedure, never public registration.

## Deployment topology

Recommended VPS topology: Nginx terminates HTTPS and proxies host/path traffic to containerized web, admin, and API services; PostgreSQL is reachable only on a private Docker network; persistent volumes hold database and initial media data; an SMTP service is external or separately operated. Health checks and controlled startup ordering are Phase 1 concerns. Secrets enter at deployment and are not built into images.

Backups should include encrypted PostgreSQL dumps/base backups plus public/private media and deployment metadata, copied off-host with retention and periodic restore tests. Deployments must coordinate migrations and application versions.

## Scaling path

Start with one VPS where justified. Later, stateless app replicas may sit behind Nginx; background work may move to workers; media may migrate behind the same abstraction to Cloudflare R2, Backblaze B2, MinIO, or another S3-compatible provider; PostgreSQL may move to a dedicated host. These are possibilities, not Phase 1 requirements.

## Planned repository shape

```text
apps/{web,admin,api}
packages/{database,ui,types,validation,permissions,pricing,email,config,seo}
docs/
infrastructure/
```

Root workspace, Docker, and infrastructure files are deferred to Phase 1 or later.

## Unresolved decisions

Authentication implementation; API transport conventions; job queue; cache; rich editor; analytics; observability stack; exact media paths/limits; storage cutover criteria; backup schedule/RPO/RTO; multi-VPS needs; and whether web/admin deploy as separate processes require architecture decisions before implementation.
