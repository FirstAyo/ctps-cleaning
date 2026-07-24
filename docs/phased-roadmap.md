# Phased Roadmap

## Purpose

This roadmap orders planned work; it is not a claim of implementation. Each phase requires scoped acceptance criteria, security review, tests, documentation, and explicit approval before scope expands.

## Phase 0 — Requirements and documentation

Create source-of-truth documents, public/admin UI specifications, architecture/repository guidance, security requirements, and this implementation plan. No application code, dependencies, database, Docker, or Nginx implementation.

## Phase 1 — Repository foundation

Plan pnpm workspace/Turborepo; public/admin Next.js apps; NestJS API; shared packages; PostgreSQL/Prisma; Docker Compose; environment validation; lint, typecheck, tests; health checks; and local instructions. No complete business features.

## Phase 2 — Premium design system

Implement approved brand/color/type/spacing/radius/shadow/container tokens; buttons, forms, cards, navigation, admin shell; themes; accessibility; responsive behavior; and restrained motion. Add Storybook/component documentation only if justified.

## Phase 3 — Public marketing website

Implement home, services, areas, About, Contact, FAQs, testimonials only when verified, calls to action, residential/commercial content, blog preview, and estimator promotion.

## Phase 4 — Before-and-after system

Implement model, media handling, admin management, accessible comparison slider/fallback, filters, gallery, details, and SEO.

## Phase 5 — Quote-request system

Implement public flow, reference numbers, typed service questions, private photos, confirmation/email, admin review/status/internal notes, security, rate limits, and audit behavior.

## Phase 6 — Price estimator

Implement configurable ranges/model, deterministic engine, admin controls, result/breakdown, quote conversion, audit logging, and comprehensive calculation tests.

## Phase 7 — Authentication and admin dashboard

Implement secure staff authentication, users/roles/permissions, protected routes, permission-aware navigation, audit logs, account controls, and secure Super Admin setup. If earlier admin tooling is needed, explicitly reconcile phase dependencies rather than weakening authorization.

## Phase 8 — Blogging system

Implement authors/profiles, posts, categories/tags, editor, media, SEO, scheduling, revisions, preview, search, RSS, sitemaps, and article pages. Do not add comments.

## Phase 9 — Job and scheduling management (possible future)

Only if later confirmed: jobs from accepted quotes, scheduling, staff assignment, status, completion records, and internal notes. This is not confirmed first-release scope.

## Phase 10 — Quality assurance and VPS deployment

Complete accessibility, responsive/browser, security, and performance reviews; image optimization; backup/restore tests; monitoring; production images; Nginx/HTTPS; VPS deployment; recovery procedures; and deployment documentation.

## Cross-phase gates

Every phase must preserve VPS portability, private/public data boundaries, server authorization, accessibility, deterministic money handling, no fabricated content, tested migration/rollback plans where relevant, and honest documentation of what is actually shipped.
