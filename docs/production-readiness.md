# Production Readiness

## Phase 12 search launch gate

Keep `PUBLIC_INDEXING_ENABLED=false` for local development and staging. Production must set a reviewed HTTPS `NEXT_PUBLIC_SITE_URL` matching `WEB_URL`, configure Nginx alternate-host and HTTP redirects to that canonical origin, and enable indexing only after content/legal/media approval. Verify live source metadata, status codes, robots, sitemap, redirects, structured data, and social previews before Search Console/Bing ownership verification and sitemap submission. Phase 12 performs no external submission and the example hostname is not a production claim.

## Phase 11.2 content-readiness gate

Approve or replace every intended Hero, service, supporting, and CTA photograph; confirm alt text/focal points; select only consented Published project proof; and verify Blog media through its lifecycle. Configure verified contact values before exposure and do not activate general submission until its receiving workflow is approved and tested.

Production never substitutes bundled development photography for missing CMS selections. Required visuals simplify neutrally and optional proof hides. Verify all redesigned marketing, service, area, portfolio, and Blog routes at 390, 768, and 1440 minimum. Phase 11.2 adds no migration or dependency and does not alter quote, estimator, jobs, project publication, Blog publication, or private-media storage.

## Topology

Nginx is the only public container on ports 80/443. It routes the public and Admin hosts to separate Next.js containers. The NestJS API and PostgreSQL have no published ports and share the internal Docker network. PostgreSQL, managed public media, and private media use distinct persistent volumes. A profile-gated migration image runs before application replacement. SMTP remains external and provider-neutral.

All application images are multi-stage Node 22 images. Next.js uses standalone output. The API deployment contains production dependencies and compiled workspace packages; Prisma generation happens during build. Runtime application users are non-root. Source-control metadata, environments, logs, backups, uploads, build output, and dependency directories are excluded by `.dockerignore`.

## Release gates

Before release: approve content/legal gaps; create the real environment; mount certificates; validate environment and Compose; back up database/media; review migrations; build/scan images; run `pnpm verify:release`; run production-style smoke tests; verify Admin authentication/private media/outbox/schedulers; record the immutable release; and test rollback ownership.

## Security and operations review

- Cookies are HttpOnly, Secure in production, SameSite=Lax, path-scoped, and host-only unless a reviewed domain is necessary.
- Nginx supplies forwarded headers and request IDs; API trusts only the configured hop count.
- Liveness is cheap. `/health/ready` checks PostgreSQL and bounded write/read/delete probes across configured media roots without returning paths.
- Production API request logs are JSON and contain safe route templates, status, duration, service/environment/release context, and request ID—not bodies or tokens.
- Unknown production exceptions return a stable message and request ID without stack details.
- The Nginx CSP currently permits inline scripts/styles because Next.js bootstrapping and the pre-paint theme script require them. This exception must be retested on every Next.js upgrade; no `unsafe-eval` is allowed.
- HSTS is enabled only on TLS listeners. Do not add preload until domain ownership, subdomains, and long-term HTTPS are approved.

## Capacity starting point

A cautious single-VPS evaluation can begin with 4 vCPU, 8 GiB RAM, SSD capacity sized for PostgreSQL plus projected media, and off-host backup space at least twice the retained working set. These are planning inputs, not capacity guarantees. Measure CPU, memory, database latency, upload processing, disk growth, and backup duration before changing limits. No production load test is authorised by this document.

## Remaining launch approvals

Real logo/contact/address/hours, approved imagery, verified testimonials, estimator prices, author biographies/articles, email sender, privacy/terms wording, retention, malware scanning, RPO/RTO, monitoring destination, and incident contacts require business or legal approval. No fake replacement may be published.

Phase 11 deployment additionally requires `MARKETING_MEDIA_PUBLIC_ROOT` on the public-media volume, `pnpm auth:initialize`, and idempotent `pnpm marketing:initialize` after a Super Admin exists. Readiness probes the new root and normal media backups include it. Generated architectural Hero placeholders require approval or replacement; do not publish unapproved assets.
