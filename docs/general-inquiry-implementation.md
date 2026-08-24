# General Inquiry implementation

## Scope

General Inquiry is a lightweight private contact workflow for visitors who are not ready to provide detailed property, service-answer, timing, and photo information. The shared form appears on Contact and beside the existing detailed flow on Request a Quote. It does not create or modify Quote Requests.

## Data and API

`GeneralInquiry` stores a UUID internal identifier, SHA-256 idempotency-key hash, normalized sender details, optional approved service key, bounded message, `NEW`/`READ` status, timestamps, and optional archive time. The additive `20260823170000_general_inquiries` migration creates the table and connects `EmailOutbox` through an optional cascading foreign key. The follow-up `20260823171500_general_inquiry_outbox_owner` migration extends the existing outbox owner constraint so exactly one Quote Request, service job, or General Inquiry owns each message. The idempotency hash is unique.

`POST /public/general-inquiries` is the only public inquiry endpoint. It returns success state only and never exposes the internal identifier. Protected Admin endpoints list, open, mark read/unread, and archive/restore records.

## Security and privacy

Submission requires a trusted browser origin, empty honeypot, strict schema, approved optional service key, and durable fixed-window throttling. The API hashes the client-generated idempotency UUID; collision/replay returns the original successful outcome without writing another inquiry. The public Next.js route is a same-origin forwarding boundary. No public read endpoint exists.

Admin routes use `generalInquiries.read`, `generalInquiries.update`, and `generalInquiries.archive`. The existing authentication, permission, CSRF, and audit architecture applies. Inquiry data must not enter sitemap, search, SEO, public CMS, Project, Blog, or Quote responses.

## Delivery and UX

Persistence, two deduplicated outbox records, and the submission audit entry are one transaction. Immediate email failure does not discard the inquiry; the existing outbox processor retries pending/failed customer acknowledgements and staff notifications. Email content directs authorized staff to Admin rather than copying the private customer message into the staff notification.

Field errors render inline. Successful submission renders an accessible state and shared success toast; operation failure uses the shared error toast. The browser reuses the same idempotency key after a failed response and creates a new key only after success.
