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

The Phase 13 audit found 20 locally Published marketing records, no Blog posts, no Before & After projects, and no Public Media assets. All marketing records rely on title/description fallbacks and have no configured social image. Navigation contains eight enabled canonical destinations. Site Settings contains the approved display name/tagline/footer defaults but no contact email or phone.

This is a development database observation, not a production migration or content edit. No records were deleted, rewritten, or created to make readiness appear better.

## Blockers before production

- **REAL CTPS LOGO REQUIRED.** The current symbol/wordmark treatment is a development brand treatment, not an approved logo asset.
- Approved production domain and matching `WEB_URL`/`NEXT_PUBLIC_SITE_URL` are required.
- A verified staff inquiry recipient and sender identity are required before production email delivery is enabled. Public persistence remains durable when delivery is unavailable, and authorized staff can review inquiries in Admin Messages.
- Final Privacy and Terms text requires business/legal approval. The Accessibility statement requires approval and a monitored feedback contact.
- Production Hero, service, audience, area, and social-sharing images require approval. Bundled Phase 11 photography is development-only and is already suppressed in production when CMS media is absent.
- Every important marketing page needs an editorial review of its effective title, description, unique body copy, CTA, and image/alt text before indexing.
- Estimator pricing must be business-approved; development pricing must not become the production Published version.
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
