# Phased Roadmap

## Purpose

This roadmap orders planned work; it is not a claim of implementation. Each phase requires scoped acceptance criteria, security review, tests, documentation, and explicit approval before scope expands.

## Phase 0 — Requirements and documentation

Create source-of-truth documents, public/admin UI specifications, architecture/repository guidance, security requirements, and this implementation plan. No application code, dependencies, database, Docker, or Nginx implementation.

## Phase 1 — Repository foundation

Plan pnpm workspace/Turborepo; public/admin Next.js apps; NestJS API; shared packages; PostgreSQL/Prisma; Docker Compose; environment validation; lint, typecheck, tests; health checks; and local instructions. No complete business features.

## Phase 2 — Premium design system

Implement approved brand/color/type/spacing/radius/shadow/container tokens; buttons, forms, cards, and navigation primitives; themes; accessibility; responsive behavior; and restrained motion. Add Storybook/component documentation only if justified. Do not implement the protected admin shell or feature-specific admin tools in this phase.

## Phase 3 — Authentication, authorization, and admin foundation

Implemented secure staff authentication; Users -> Roles -> Permissions; server-side permission enforcement; protected routes; permission-aware navigation; the protected admin shell; account and session security; secure initial Super Admin setup; and the audit-log foundation. Reusable authorization guards and resource-ownership policy boundaries now precede every protected feature module. Phase 3 remains a dependency gate: no later phase may implement protected admin tools or expose private staff/customer data without using these verified controls.

## Phase 4 — Public marketing website

Implemented the static home, service and area pages, About, Contact foundation, FAQs, honest empty testimonial state, calls to action, residential/commercial content, local demonstration portfolio, planned blog preview, estimator foundation, quote-request foundation, metadata, safe structured data, sitemap, and robots behavior. Phase 4 adds no submissions, uploads, calculations, database-backed projects, or publishing.

## Phase 5 — Before-and-after system

Implemented the PostgreSQL project/media model, private/public local storage abstraction, validated and processed multi-image uploads, permission-protected admin list/editor/lifecycle controls, accessible comparisons, published gallery/detail routes, filters, homepage featured-project behavior, SEO metadata, dynamic sitemap entries, and audit events. Draft and Archived projects and their media remain private. See `before-after-implementation.md`.

## Phase 6 — Quote-request system

Implemented the guest multi-step public flow, durable request drafts, unique references, typed service questions, approved service areas, private photos, high-entropy confirmation links, SMTP-compatible email delivery with a durable outbox, permission-protected admin review/status/assignment/internal notes/private media/archive/delete controls, abuse controls, and audit events built on the Phase 3 foundation. See `quote-request-implementation.md`.

## Phase 7 — Price estimator

Implemented configurable version/service/rule models, a deterministic integer-cents engine, permission-protected admin controls, expiring tokenized results, safe public explanations, quote transfer with match-state validation, audit events built on the Phase 3 foundation, and calculation/security tests. Initial values remain an explicitly unapproved Draft until CTPS reviews and publishes them. See `estimator-implementation.md`.

## Phase 8 — Blogging system

Implemented permission- and ownership-protected authoring for posts, profiles, categories/tags, strict structured content, managed private/public media, SEO, revisions, authenticated preview, explicit publishing, and durable scheduled publication. Public routes now provide Published-only search, article/category/tag/author pages, related posts, RSS, and dynamic sitemap discovery. No comments were added. See `blog-implementation.md`.

## Phase 9 — Operational jobs, scheduling, and service fulfilment (implemented)

Implemented private staff scope includes eligible quote conversion, staff-created jobs, secure references, operational snapshots, lifecycle/history, Vancouver scheduling and conflicts, assignments, accessible list/calendar views, checklists, timing, separated notes, private media, incidents, completion/follow-up, cancellation/closing/archiving, outbox notifications, auditing, tests, and documentation. No public booking, customer account, payment/invoice, live availability, or public job tracker is included. See `jobs-scheduling-implementation.md`.

## Phase 10 — Quality assurance and VPS deployment

Complete accessibility, responsive/browser, security, and performance reviews; image optimization; backup/restore tests; monitoring; production images; Nginx/HTTPS; VPS deployment; recovery procedures; and deployment documentation.

## Cross-phase gates

Every phase must preserve VPS portability, private/public data boundaries, server authorization, accessibility, deterministic money handling, no fabricated content, tested migration/rollback plans where relevant, and honest documentation of what is actually shipped. Any protected administration added in Phases 5–9 must use the authentication, authorization, protected-route, admin-shell, Super Admin, and audit foundations completed in Phase 3; feature phases may extend those controls but must not defer or bypass them.
