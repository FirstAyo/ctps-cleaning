# Jobs, Scheduling, and Service Fulfilment Implementation

## Scope and boundary

Phase 9 implements private staff operations after quote review. It is not a public booking system. No public job API, customer login, live availability, self-reschedule/cancel link, payment, checkout, invoice, GPS, payroll, routing, or public tracker exists.

## Workflow and lifecycle

Authorized staff converts an eligible Accepted quote, or explicitly confirms external acceptance of a Quote Prepared/Contacted request, into one linked job. A separately permissioned staff-created flow handles phone and repeat work without fabricating a quote.

Jobs use `DRAFT`, `READY_TO_SCHEDULE`, `SCHEDULED`, `CONFIRMED`, `EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `FOLLOW_UP_REQUIRED`, `CANCELLED`, `CLOSED`, and `ARCHIVED`. The API owns the legal transition graph. Scheduling, confirmation, completion, cancellation, closing, and archiving apply additional prerequisites and preserve status/activity history. Optimistic integer versions reject stale edits.

## Data model

`ServiceJob` stores immutable reference and approved customer/property snapshots, scope, UTC schedule, operational timestamps, completion/cancellation/follow-up fields, coordinator, actors, and version. Related models store canonical services, assignment history, schedule history, status history, separated notes, checklist items, private media/variants, incidents, and a safe activity timeline. Existing `EmailOutbox` supports either a quote or job owner and idempotent job notification keys.

## References

References are server-generated as `JOB-YYYY-XXXXXXXXX`. Nine symbols are selected with Node cryptographic randomness from `23456789ABCDEFGHJKMNPQRSTUVWXYZ`. This avoids common ambiguous characters and provides approximately 44.6 bits of suffix entropy. A database unique constraint enforces uniqueness and creation retries eight times on collision. Clients cannot submit or update the reference.

## Quote conversion and estimator context

Conversion runs serializably, copies only operational snapshots, creates canonical service rows, and leaves the quote unchanged. A unique nullable quote relation prevents duplicate conversion. Job detail shows an existing estimator snapshot only as “Preliminary estimate — not a final quote”; no final price, charge, or invoice is created.

## Permissions

Phase 9 adds granular `jobs.*` permissions for read/read-assigned, creation, editing, scheduling/rescheduling, assignment, lifecycle, completion, cancellation, closing, archiving/deletion, notes, checklists, private media, incidents, calendar, notifications, and conflict override. Super Admin receives all through the existing invariant. Admin receives no automatic job grants. Author receives none. No Worker role was introduced; existing configurable roles can provide least-privilege worker access.

## Scheduling and time zone

Admin-entered Vancouver wall time is validated against `America/Vancouver`, converted to UTC, rejects spring-forward gaps, and requires earlier/later disambiguation for repeated autumn times. PostgreSQL stores UTC instants; Admin rendering explicitly uses `America/Vancouver`.

Conflict detection uses interval overlap: another active job conflicts when its start is before the proposed end and its end is after the proposed start for an active assignee. Exact boundaries do not conflict. Cancelled, Closed, and Archived jobs are ignored. Override requires `jobs.overrideConflicts`, an explicit flag, a written reason, and audit/history records.

## Admin and API routes

Protected Admin routes are `/jobs`, `/jobs/calendar`, `/jobs/new`, and `/jobs/[id]`. They provide list/filter, accessible agenda, quote/internal creation, and detail workflows for schedule, assignments, checklist, notes, media, incidents, history, notifications, completion, and follow-up. The BFF allowlist contains only required job mutations and narrow media proxy routes.

The dedicated NestJS module exposes authenticated `admin/jobs` list, calendar, detail, creation, conversion, schedule, assignment, status, checklist, note, incident, completion, cancellation, notification, deletion, upload, and media-delivery endpoints. No `public/jobs` endpoint exists.

## Assignments, checklist, timing, and incidents

Assignments support Lead, Crew Member, and Coordinator history. Only active users may be assigned. Partial unique indexes prevent duplicate active assignments and multiple active leads. Checklist items are bounded plain text, categorized, ordered with Move Up/Move Down controls, and record completion actor/time. No checklist templates are seeded or presented as legal/safety guidance.

En Route, Arrived, Start, Pause, Resume, and completion transitions use server timestamps. Completion requires a summary, service start, completed required items, and no unresolved blocking incident unless an authorized override reason is recorded. Incidents store validated severity, blocking state, reporter, and resolution context. Continuous location, wage, and payroll tracking are absent.

## Notes and private media

Internal and customer-facing notes are distinct bounded plain-text records. Internal note bodies never enter customer messages or audit metadata.

Job images use only `storage/private/jobs`. JPEG, PNG, and WebP extension, MIME, signature, decode, size, dimensions, and pixel count are validated. Sharp auto-orients, strips metadata through re-encoding, avoids upscaling, and creates deterministic WebP original, large, standard, and thumbnail variants under generated UUID paths. Unsupported/active formats, mismatches, corrupt files, and traversal are rejected.

Every media read requires authentication, job visibility, and `jobs.readPrivateMedia`. Responses are `private, no-store`, `nosniff`, and `noindex`. There is no public job-media route or automatic marketing transfer.

## Notifications and reminder CLI

Authorized staff may queue Scheduled, Rescheduled, Cancelled, or Completed customer messages through the existing outbox. Payloads include the job reference, Vancouver schedule summary, and explicitly customer-facing note only. They contain no database ID, private-media URL, internal note, staff email, invoice, payment link, or self-service action. Unique deduplication keys make queueing repeat-safe; delivery failure does not roll back job state.

`pnpm jobs:send-reminders` is a bounded, repeat-safe CLI suitable for future VPS cron/systemd invocation. Production scheduler infrastructure remains deferred.

## Audit, accessibility, and responsive behaviour

All sensitive job operations emit safe audit/activity events without customer contact/address, note bodies, storage paths, or tokens. Forms have labels and text status, tables have captions, lifecycle status is not color-only, checklist ordering has named buttons, and the calendar has a semantic agenda alternative. Operational layouts collapse for narrow screens without removing critical data.

## Environment and local development

Validated `JOBS_*` settings cover feature flag, fixed Vancouver time zone, duration/page/calendar bounds, private-media storage/processing, fixed reference prefix, and reminder bounds. Nothing is exposed through `NEXT_PUBLIC_*`.

Run `pnpm db:start`, `pnpm db:migrate`, `pnpm auth:initialize`, and normal development processes. Use `pnpm verify:jobs-runtime` for disposable workflow verification and `pnpm jobs:send-reminders` for due reminders.

## Known limitations and deferred work

Production cron/systemd, malware scanning, S3 storage, reusable checklist-template administration, customer portal, appointment confirmation, payments, invoicing, SMS, GPS, route optimization, payroll, inventory, public tracking, and consent-reviewed portfolio transfer remain deferred. Filesystem and database writes cannot share one atomic transaction, so rare orphan reconciliation remains an operational concern.
