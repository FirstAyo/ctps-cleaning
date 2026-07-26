# Quote Request Implementation

Phase 9 allows eligible Accepted requests—or Quote Prepared/Contacted requests with explicit staff confirmation of external acceptance—to be converted once into a protected operational job. Conversion preserves the quote and copies only approved snapshots. Quote detail displays the linked job without exposing it publicly.

## Scope and outcome

Phase 6 implements a guest quote-request workflow for residential and commercial customers. A request may contain multiple approved services, server-validated typed answers, property and contact details, up to three preferred dates, consent, notes, and optional private images. Successful submission creates a durable record and `CTPS-YYYY-XXXXXXXX` reference. It confirms receipt only; no price, estimate, appointment, payment, job, or customer account is created.

The phase also implements protected staff list/detail views, status transitions, assignment, internal notes, private image review, archive/restore, constrained permanent deletion, email delivery state, and audit events. Every staff route uses the Phase 3 authentication and permission guards.

## Public flow

`/request-a-quote` is an eight-step accessible form: property, services, service questions, address, preferred dates/notes, optional photos, contact, and review/consent. It has visible progress, Back/Continue controls, responsive fields, upload state, image previews, remove/reorder controls, and an explicit receipt-not-booking notice. Only the step number, selected service keys, and property type are recoverable in `sessionStorage`; contact, address, notes, answers, tokens, and images are not stored there.

The server returns the centralized service/question definitions and approved areas when it creates a draft. Definitions currently cover window cleaning, pressure washing, gutter cleaning, moss removal, and configurable vent type. Areas are Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver, British Columbia. These definitions contain no prices.

## Draft, upload, and submission protocol

1. `POST /public/quote-requests/drafts` creates an expiring draft and returns a 256-bit possession token. Only its SHA-256 hash is stored.
2. Upload, remove, and reorder calls provide that token in `x-quote-draft-token`. Files remain associated with the draft until submission.
3. `POST /public/quote-requests` requires the draft token, a UUID idempotency key, all form fields, honeypot, and consent. A serializable transaction creates the request with a server-generated reference, transfers ready uploads, marks the draft used, and writes the submission audit event.
4. The raw 256-bit confirmation token is returned once and its hash is stored. `/request-a-quote/confirmation?token=...` resolves only this token. A reference is not accepted as a public lookup key and there is no public tracking endpoint.
5. Repeating a known idempotency key returns a non-sensitive already-submitted response without creating another request. The browser keeps one key for the submission attempt.

The web BFF accepts only a narrow route allowlist and rejects requests whose Origin/Referer does not match `WEB_URL`. The API repeats that origin check, binds drafts to a hashed IP/user-agent source, uses durable action/source throttles, enforces a minimum completion time, rejects a non-empty honeypot, and revalidates every field. The confirmation route is noindex and excluded by robots policy.

## Data model

- `QuoteRequestDraft`: hashed possession token, hashed source, expiry, and one-time submission state.
- `QuoteRequest`: reference, hashed confirmation and idempotency identifiers, property/contact/address fields, JSON service/answer snapshots, dates, consent, workflow state, assignment, archive state, and timestamps.
- `QuoteRequestUpload`: quote-specific private media metadata and draft/request ownership.
- `QuoteRequestNote`: immutable staff-only note with author and timestamp.
- `QuoteRequestStatusHistory`: actor and from/to status history.
- `PublicRequestThrottle`: durable fixed-window abuse-control state.
- `EmailOutbox`: structured template payload, delivery status, attempts, safe failure code, and sent time.

Migration `20260725010815_phase_6_quote_request_system` creates these enums, tables, relations, unique constraints, and indexes. The migration is additive. Application rollback can restore the earlier image after stopping Phase 6 writes; schema rollback should be a deliberate forward migration after preserving quote and outbox data.

Corrective migration `20260725040000_secure_quote_references` removes the obsolete counter table and adds an uppercase-reference database constraint. New references use `CTPS-YYYY-XXXXXXXX`, where the eight-character suffix contains 40 bits of cryptographic randomness from an uppercase 32-character alphabet that excludes `0`, `1`, `I`, and `O`. The API is the only reference writer, retries a new value after a database uniqueness collision, and always returns the original reference for an idempotent replay. References are normalized at creation, immutable through every API, and never expose database identifiers.

## Private image handling

Quote images are isolated from the before-and-after library under `storage/private/quote-requests`. JPEG, PNG, and WebP are accepted only when filename extension, supplied MIME, and detected signature agree. The API limits count, per-file bytes, aggregate bytes, and decoded pixels; Sharp rejects corrupt input, applies orientation, strips source metadata by re-encoding, constrains dimensions, and writes a generated WebP preview beneath a UUID key. Path keys are allowlisted and resolved beneath the configured root.

There is no public quote-media route. `quoteRequests.readPrivateMedia` is required for the admin stream; responses use `private, no-store` and `nosniff`. Storage keys, checksums, filesystem paths, and draft/confirmation tokens never appear in customer, admin, or audit responses. Removed draft images are deleted immediately. Retention cleanup and malware scanning require production policy approval.

## Email and delivery failures

`@ctps/email` provides SMTP, log-safe, and disabled adapters plus customer-receipt and staff-notification templates. The customer message includes the reference and states that receipt is not a quote or booking. The staff message contains only reference and service keys and directs staff to the protected admin; private details are not embedded unnecessarily.

Two durable outbox rows are created inside the request transaction. Delivery is attempted immediately and records `SENT` or `FAILED`, attempt count, and a safe error class. Email failure never rolls back or hides a successful submission. Hourly maintenance retries pending/failed messages up to five attempts in bounded batches. Production operations must monitor exhausted failures and alert staff; delivery remains independent of submission success.

## Permissions and administration

Phase 6 adds:

- `quoteRequests.read`
- `quoteRequests.update`
- `quoteRequests.changeStatus`
- `quoteRequests.assign`
- `quoteRequests.addInternalNotes`
- `quoteRequests.readPrivateMedia`
- `quoteRequests.archive`
- `quoteRequests.delete`

The Super Admin receives all known permissions through the existing invariant. Admin and Author roles receive none of these by default. Admin navigation appears only with read permission, while every API action independently checks its specific permission.

The list supports search, status, active/archive filtering, pagination, assignment summary, and received time. Detail shows customer/property data, service answers, dates, consent, images when authorized, internal notes, status history, assignment, and email status. Status changes follow an explicit transition map. Permanent deletion requires both an archived record and a terminal `CLOSED`, `CANCELLED`, or `DECLINED` state plus browser confirmation.

Audit actions include submission, status change, assignment, internal-note addition, archive/restore, and deletion. Metadata contains only safe summaries and never note bodies, tokens, contact values, or storage details.

## API inventory

Public:

- `POST /public/quote-requests/drafts`
- `POST /public/quote-requests/uploads`
- `DELETE /public/quote-requests/uploads/:id`
- `PUT /public/quote-requests/uploads/order`
- `POST /public/quote-requests`
- `GET /public/quote-requests/confirmation/:token`

Protected:

- `GET /admin/quote-requests`
- `GET /admin/quote-requests/:id`
- `GET /admin/quote-requests-assignees`
- `POST /admin/quote-requests/:id/status`
- `PUT /admin/quote-requests/:id/assignment`
- `POST /admin/quote-requests/:id/notes`
- `POST /admin/quote-requests/:id/archive`
- `DELETE /admin/quote-requests/:id`
- `GET /admin/quote-requests/:id/uploads/:uploadId`

## Environment and operations

The validated variables are documented in `.env.example`: private root; draft TTL; minimum completion time; rate window/limit; upload count/byte limits; email mode/from/staff recipient; and SMTP host, port, TLS, user, and password. SMTP host becomes mandatory when SMTP mode is selected. Production must mount the private root persistently outside any web document root, align proxy upload limits, back up database and private media together, and test restoration.

## Verification and remaining approval gates

Strict typecheck, lint, unit/functional/security tests, production builds, migration status, and local runtime checks form the Phase 6 verification set. Tests cover typed question validation, invalid areas, honeypot/consent, token/origin controls, throttle behavior, idempotent replay, confirmation-token lookup, invalid image boundaries, permission enforcement, workflow transitions, and email-failure durability.

Before production, CTPS must approve final privacy/legal wording, retention and secure-deletion periods, malware-scanning policy, real sender/recipient/SMTP credentials, delivery retry/alert operations, and backup/restore results. Phase 7 permits a short-lived opaque estimator transfer to prefill allowlisted compatible fields. The quote API revalidates it, stores an informational immutable estimate snapshot, and records Matched, Inputs Changed, or Expired without blocking submission. Phase 9 permits protected staff conversion into an operational job. Public booking, payment, customer authentication, customer self-service scheduling, and public customer-photo behavior remain excluded.
