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

Phase 3 implements staff-only authentication in the NestJS API using Argon2id passwords and opaque PostgreSQL sessions whose raw tokens exist only in an HttpOnly cookie. The admin validates sessions and forwards cookies server-side but never independently grants access. Authorization maps Users -> Roles -> Permissions through typed constants and API guards; the Super Admin effective-permission invariant is protected. Initial Super Admin creation uses a masked trusted-terminal CLI, never public registration. Session-bound synchronizer tokens protect unsafe cookie requests, and database records provide durable login throttling and audit history. See `authentication-authorization-implementation.md`.

## Phase 5 media and portfolio boundary

The API owns before-and-after project lifecycle, metadata, image validation/processing, and delivery authorization. PostgreSQL stores project relationships and media metadata; generated WebP bytes use separate local private/public roots through a storage adapter. Admin previews remain cookie-authenticated and no-store. Public queries hardcode Published state, public media delivery rechecks database visibility, and web/admin proxy routes never reveal storage keys or filesystem paths. See `before-after-implementation.md`.

## Phase 6 quote-request boundary

The public Next.js application hosts the accessible multi-step guest experience and a narrow same-origin BFF. The NestJS API remains authoritative for definitions, validation, approved areas, draft possession, abuse controls, image processing, idempotency, reference allocation, confirmation, and workflow state. PostgreSQL stores quote data, hashed draft/confirmation/idempotency identifiers, durable throttles, status history, notes, assignments, audit events, and structured email outbox records. The email package owns safe customer/staff templates and SMTP/log-safe/disabled delivery adapters. Customer images have an isolated private-only store and quote-specific schema. The admin application consumes protected APIs and streams images only through permission-checked no-store routes. See `quote-request-implementation.md`.

## Phase 9 operational jobs boundary

The API owns quote conversion, operational snapshots, lifecycle transitions, UTC/Vancouver scheduling, assignment conflicts, checklists, notes, private job media, incidents, completion rules, audit events, and job-linked email outbox records. The Admin consumes protected APIs through a narrow BFF. There is no public jobs API or media route. PostgreSQL stores metadata/history while bytes remain isolated under `storage/private/jobs`. See `jobs-scheduling-implementation.md`.

## Deployment topology

## Phase 8 blog boundary

The API owns strict structured-content validation, post ownership, lifecycle transitions, revisions, taxonomy, managed blog-media visibility, simple Published-only search, related-post selection, and due-publication processing. The admin is an authenticated BFF/client of that policy; the public web reads a separate Published-only API and renders structured React elements without executing stored HTML. PostgreSQL stores editorial metadata and revision snapshots while bytes remain behind distinct private/public storage roots. See `blog-implementation.md`.

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

Phase 7 keeps the estimator boundary explicit: PostgreSQL owns versioned business configuration and immutable result snapshots; `packages/pricing` owns the pure deterministic integer-cents engine; the API owns calculation, persistence, transfer validation, and protected administration; public web and admin remain separate consumers. See `estimator-implementation.md`.

MFA, email-based recovery, audit retention, general job queue, cache, richer inline editing, analytics, observability stack, storage cutover criteria, backup schedule/RPO/RTO, multi-VPS needs, and whether web/admin deploy as separate processes remain future decisions. Phase 5 local media paths and limits are recorded in `before-after-implementation.md`; Phase 8 blog scheduling uses the bounded `blog:publish-due` CLI rather than a hosted cron dependency.
