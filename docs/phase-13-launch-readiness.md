# Phase 13 launch readiness

## Readiness model

Phase 13 keeps four decisions separate:

- **Software readiness:** deterministic builds, tests, security boundaries, public routes, Admin workflows, metadata, and operational tooling.
- **Content readiness:** approved copy, useful published articles/projects, contextual alt text, and final policy text.
- **Business-configuration readiness:** verified logo, contact methods, legal approvals, pricing approval, sender identities, retention, and operational ownership.
- **Deployment readiness:** production secrets, domain/DNS, VPS, TLS, backups, monitoring, scheduled tasks, SMTP, canonical redirects, and the explicit indexing switch.

Automated software success does not mean the platform is launch ready. Phase 14 must not begin until every blocker below has an owner and an approved value or asset.

## Phase 13 technical corrections

- Removed a duplicate Homepage `WebSite` object that hardcoded a localhost origin. Homepage structured data now uses only the centralized configured-origin builders.
- Removed unapproved Privacy, Terms, and Accessibility foundations from the sitemap and made them `noindex, follow` until final text is approved.
- Replaced the disabled general-contact form with a functional, persisted General Inquiry workflow shared by Contact and Request a Quote. The detailed Quote Request remains a separate intent and data model.
- Removed customer-visible development/CMS wording from source fallbacks and default marketing content where neutral factual copy was available.
- Tightened the Homepage process timeline spacing without changing its approved timeline composition.
- Made production marketing initialization create missing default pages as Drafts. Development may still publish safe defaults; production requires an authorized review and explicit publish action.
- Added a deterministic content-readiness scan to release verification.

## Local content inventory

The Phase 13.1 audit found 20 locally Published marketing records, no Blog posts, three Draft Before & After projects, and no Public Media assets. All three project records contain confirmed development placeholder copy; they were unpublished through the normal project lifecycle, all 13 related assets are now Ready/Private, and `/projects` renders the honest empty state. All marketing records rely on title/description fallbacks and have no configured social image. Navigation contains eight enabled canonical destinations, including `Projects` at `/projects`. Site Settings contains display-name/tagline/footer fallback data but no verified contact email, phone, logo, or social image.

This is a development database observation, not a production migration or fabricated content edit. No record was deleted, rewritten into fake production content, or created to make readiness appear better. The legacy system navigation row was narrowly normalized from `Before & After`/`/before-after` to `Projects`/`/projects`; future initializer runs make the same exact-match repair without overwriting unrelated Admin edits.

## Phase 13.1 local acceptance snapshot

- A clean root `pnpm dev` started the public web on 3000, Admin on 3001, and API on 4000; `/health`, `/health/database`, and `/health/ready` returned 200.
- Browser rendering covered all primary public routes plus an intentional 404. Homepage and Projects were checked at 390, 768, 1024, 1152, 1280, 1366, 1440, and 1920 pixels with no horizontal overflow or failed network request.
- Light, dark, system, persisted dark, and reduced-motion states rendered correctly. The rotating Hero now declares eager loading explicitly for its above-the-fold slides, removing the observed Next.js LCP console warning.
- Signed-out `/`, `/jobs`, and the Admin login surface correctly resolved to `/login`. Authenticated Admin acceptance was not attempted because no credential was supplied; the existing single-use bootstrap correctly refuses to replace the usable Super Admin. Resetting, bypassing, or exposing credentials is not an acceptable QA shortcut.
- Quote runtime verification passed with one persisted submission, idempotent replay, a normalized British Columbia service area, private data boundaries, and cleanup. Estimator and auth runtime CLIs correctly refused destructive fixture setup because a Published pricing version and a Super Admin already exist. Their automated suites remain required evidence; authenticated browser acceptance remains pending.
- Local email uses the safe default `log-safe` mode with invalid example sender/recipient defaults because SMTP is not configured. This proves durable outbox behavior, not production delivery.
- The current Published pricing version is `2026-Q3-DRAFT`; its development marker makes business pricing approval and replacement/renaming an explicit launch blocker. No value or status was changed during this pass.

## Phase 13.2 business-configuration controls

Protected Site Settings now provides one authoritative path for the business display name, optional
public email and phone, footer copy, announcement text/visibility, verified HTTPS social profiles,
an approved managed logo, and a default managed social image. Logo and social-image selection uses
the existing Public Media picker/upload/validation/focal workflow. The API accepts only active
managed assets, records Site Settings usage, and blocks referenced deletion. Empty optional values
are omitted from public presentation and Organization structured data. The managed logo is shared
by desktop/mobile Header and Footer; the local CTPS treatment remains only when no logo is selected.
The default social image is used only when a page lacks its own deliberate managed image; 1200 × 630
is the preferred editorial source composition.

Production estimator selection now fails closed when the only effective Published version is
development-marked (`DEV`, `DEVELOPMENT`, `TEST`, `SAMPLE`, or `DRAFT` as a version-code segment),
when there is not exactly one effective Published version, or when the five-service configuration is
incomplete/invalid. The customer receives only “Online estimates are temporarily unavailable.
Request a quote instead.” Internal version codes and prices are not exposed by this unavailable
state. This does not approve, rename, archive, or change any pricing value; an authorised operator
must create/review/publish a business-approved replacement through the protected Pricing workflow.

The content-readiness scan now also checks its bounded customer-facing source list for Lorem Ipsum,
Edgar, demo/test project wording, and placeholder-customer-content wording. Tests and fixtures remain
outside that production-content scope so rejection tests do not create false release failures.

SMTP host, port, transport security, username, password, approved sender address, approved sender
display name (`EMAIL_FROM_NAME`), and staff notification recipient remain environment-managed. Site
Settings does not store SMTP credentials. Email templates contain no configured phone/address or
localhost link; production validation continues to reject non-SMTP delivery, `.invalid` addresses,
and `CHANGE_ME` values. No real message is sent by Phase 13.2.

## Blockers before production

- **REAL CTPS LOGO REQUIRED.** The current symbol/wordmark treatment is a development brand treatment, not an approved logo asset.
- Approved production domain and matching `WEB_URL`/`NEXT_PUBLIC_SITE_URL` are required.
- A verified staff inquiry recipient and sender identity are required before production email delivery is enabled. Public persistence remains durable when delivery is unavailable, and authorized staff can review inquiries in Admin Messages.
- Final Privacy and Terms text requires business/legal approval. The Accessibility statement requires approval and a monitored feedback contact.
- Production Hero, service, audience, area, and social-sharing images require approval. Bundled Phase 11 photography is development-only and is already suppressed in production when CMS media is absent.
- Every important marketing page needs an editorial review of its effective title, description, unique body copy, CTA, and image/alt text before indexing.
- Estimator pricing must be business-approved; development pricing must not become the production Published version.
- Replace the currently Published `2026-Q3-DRAFT` version with a business-approved production version through the protected pricing workflow; do not edit production prices merely to clear a readiness report.
- SMTP sender, staff recipient, provider credentials, and delivery monitoring must be approved and configured.
- Retention, malware-scanning decision, backup RPO/RTO, off-host backup destination, monitoring destination, and incident contacts require owners and approval.
- Authenticated visual QA, physical keyboard/screen-reader review, and representative real-device/browser review must be completed where automated browser tooling cannot supply evidence.

## Important pre-launch content

- Add at least one consent-approved Published Before & After project so customers can evaluate real work; absence is not a software failure.
- Publish useful reviewed Blog articles with approved author profiles, featured media, and metadata.
- Review the six area pages for genuinely useful local context without city-name substitution, fabricated claims, or doorway-page expansion.
- Add deliberate per-page SEO titles/descriptions and a public social-sharing image.
- Review all Public Media alt text, focal points, dimensions, crops, duplicate checksums, filenames, archive state, and usage after real assets are uploaded.

## Optional after launch

- Additional articles and project records.
- Broader taxonomy depth after substantive content exists.
- Legitimate testimonials only if a separately approved product scope and evidence workflow is introduced.
- External link monitoring and richer content-readiness reporting.

## General Inquiry readiness

The shared General Inquiry form accepts name, email, and message, with optional phone and approved service interest. It uses strict validation, an empty honeypot, trusted-origin enforcement, durable throttling, hashed idempotency, private persistence, audited Admin read/archive actions, and the existing email outbox. Super Admin receives the new inquiry permissions through the existing permission initializer; other roles require an explicit grant. Inquiries are never public, indexable, or represented as Quote Requests.

Manual authenticated Admin review, real SMTP delivery, and representative browser/device evidence remain launch blockers until completed in the target environment.

## Initializer and publication safety

`auth:initialize` remains idempotent. `marketing:initialize` requires an existing active Super Admin. In production it creates missing fixed-page definitions as Draft and does not upgrade or publish default copy automatically. Development retains convenient Published defaults. Existing records and Admin edits are never overwritten. Pricing development initialization remains an explicitly named development command and must not be run as a production bootstrap.

## Media safety

Production rendering never substitutes bundled Phase 11 photography for absent managed media. Optional Blog/project proof stays hidden or uses an honest empty state. Public Marketing, Published Blog, and Published Before & After media remain separate from private Quote, Job, Draft Blog, and private project namespaces. No development photography was promoted or represented as CTPS work in Phase 13.

## SEO and legal launch gate

Keep `PUBLIC_INDEXING_ENABLED=false` in development and staging. Legal foundations remain outside the sitemap and noindex until approved final documents replace them. Enable production indexing only after canonical HTTPS redirects, content, public media, legal approval, status codes, robots, sitemap, JSON-LD, and representative social previews pass on the real host.

## Phase 14 prerequisites

- VPS and recovery access; deployment user; supported Docker/Compose.
- Final public/Admin hostnames and DNS control.
- TLS certificate/renewal plan, firewall policy, and SSH policy.
- Production PostgreSQL credentials and independently generated session secrets.
- Final `WEB_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_URL`, API topology, CORS origins, and trusted proxy hops.
- Persistent public/private media paths with reviewed ownership and capacity.
- Approved logo, photography, contact values, legal text, email identities, and pricing.
- SMTP credentials and monitored delivery mode.
- Backup root, encrypted off-host destination, retention, RPO/RTO, and completed isolated restore rehearsal.
- Monitoring/alert destinations, incident contacts, log retention, and disk/certificate/outbox/scheduler alerts.
- Locked scheduled publication, outbox, reminders, cleanup, and backup tasks.
- Final staging smoke, authenticated Admin/CMS/Blog/Quote/Estimator/Jobs QA, private-media denial, accessibility review, and cross-browser/device evidence.
- Explicit approval before enabling indexing, verifying search-engine ownership, or submitting the sitemap.

Phase 13 does not provision infrastructure, change DNS/TLS/firewall/SSH, send production email, enable indexing, submit search-engine data, commit, or push.
