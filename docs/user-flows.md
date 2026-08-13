# User Flows

## Purpose

This document describes planned end-to-end behavior and critical recovery paths. It does not indicate that any flow is implemented.

## SEO readiness review

An authorized user opens `/seo`, reviews Published-content counts and deterministic findings, filters by content family/severity/missing metadata, and follows a deep link to the existing Marketing, Blog, or Project editor. The normal Draft, preview, version, permission, publish, and audit workflow remains authoritative. The dashboard never edits canonical origin/index policy, exposes Draft/private data, calls external SEO services, or rewrites content.

## Browse and request a quote

1. Visitor discovers a service or service-area page.
2. Visitor selects one or multiple available services and residential/commercial context.
3. The form gathers service-specific property details, address/service area, contact details, preferred dates, notes, consent, and optional photos.
4. The visitor reviews and submits. Client validation improves usability; the server revalidates, rate-limits, and authorizes upload associations.
5. On success, the system displays and emails a unique reference number. This confirms receipt only.
6. Authorized staff reviews details/photos, records internal notes, changes status, and contacts the customer.

Recoverable errors preserve non-sensitive answers and identify affected fields. Upload failures can be retried or removed without duplicating the request. Duplicate submission protection is recommended. Guest progress is limited to the current browser session unless a secure recovery design is approved; do not promise cross-device saving.

## Preliminary estimator to quote

1. Visitor chooses one supported service, customer/property type, service area, and conditional details.
2. API validates answers and loads active, effective, compatible pricing configuration.
3. Code-controlled engine returns a deterministic range and safe explanation or an unavailable/configuration error.
4. UI labels the tokenized, expiring result non-binding and offers Start Over or transfer to Quote.
5. A separate short-lived opaque transfer carries only allowlisted compatible answers; the visitor can edit them and adds address/contact/consent/photos before submitting.
6. The API records Matched, Inputs Changed, or Expired without treating the result as a formal quote or blocking a changed request.

An estimate is not a formal quote and never confirms a booking. Confidential rule details remain server-side.

## Staff quote review

Authorized staff opens a filtered request list, views only permitted customer data, reviews uploads through authorized private access, adds internal notes, and changes status with audit history. High-impact or irreversible actions require confirmation. Expected states include New, Under Review, More Information Required, Estimate Reviewed, Quote Prepared, Contacted, Accepted, Declined, Closed, and Cancelled; final transition rules remain to be defined.

## Author publishing

An Author creates a Draft, edits strict structured content/taxonomy/managed images/SEO, previews it through authenticated private delivery, and may publish, schedule, or archive their own post. The server validates ownership and optimistic version on every read and mutation. Due Scheduled posts are processed by the repeat-safe `pnpm blog:publish-due` CLI. Revision and publishing history remain visible; other staff content requires a separate all-content permission.

## Staff operational fulfilment

Authorized staff converts one eligible accepted quote—or creates a separately permissioned internal record—into a Draft job. Staff records a Vancouver appointment, resolves assignment conflicts, assigns a lead/crew, manages a private checklist, notes, photos, and incidents, then records arrival, service start, completion, follow-up, closing, and archiving. Customers do not log in, inspect availability, confirm, reschedule, cancel, pay, or track staff through the application.

## Super Admin access management

The initial Super Admin is provisioned through a secure setup mechanism. A Super Admin creates/disables users, creates roles, groups and assigns permissions, and reviews confirmation/change summaries. The system prevents removal or disablement of the final active Super Admin and records an audit event.

## Managed content and media

Authorized users create services, areas, projects, posts, and media metadata according to permissions. Public publishing validates slugs, visibility, SEO, relationships, and required accessible text. Public media is optimized and addressable; private quote uploads require authorized access. Safe deletion checks references and retention policy.

## Release and recovery operations

An operator validates an untracked production environment, verifies database/media backups,
reviews and deploys migrations, starts the internal topology behind Nginx/TLS, checks readiness and
representative workflows, configures locked schedulers/monitoring, and records the release. Upgrade
failure uses prior compatible images or a reviewed forward correction. Backup restoration is
rehearsed in isolation and never overwrites the main database by default.

## Phase 11.2 marketing-page flow

1. An authorized editor changes only labeled controls on a fixed page.
2. General photography is chosen/uploaded through Public Media with alt and focal controls.
3. Proof may select a Published Before & After record when permitted; bytes are not copied.
4. Save validates managed media, Published identifiers, safe links, bounded sections, and version.
5. Preview stays private/no-store/noindex; Publish copies validated Draft content and lifecycle references.
6. Visitors see Published content only. Optional missing proof disappears; Contact and Quote remain distinct.

## Marketing editor flow

An authorised editor opens a fixed page, changes approved fields or section order/visibility, selects public-library media, and saves a version-checked Draft. Visitors continue seeing the prior Published snapshot. The editor opens an authenticated noindex preview, then a user with `pages.publish` publishes. Restore selects an immutable revision and creates a new Draft version. Separate flows manage fixed-destination navigation and approved site fields. AUTHOR is denied unless explicitly granted.
