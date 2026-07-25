# Security Requirements

## Purpose

This document establishes minimum controls for the planned system. Specific libraries are deliberately not finalized.

## Identity and sessions

Staff authentication only is implemented for the admin scope; Phase 6 guest quote submission requires no account. Phase 3 uses Argon2id, 256-bit opaque PostgreSQL sessions stored only as hashes, secure/HttpOnly/SameSite cookies, absolute and idle expiry, revocation and rotation, durable time-limited login throttling, and a non-public masked Super Admin CLI. Production environment validation refuses insecure authentication cookies. Details and parameters are recorded in `authentication-authorization-implementation.md`.

## Request protection

Use HTTPS, trusted proxy configuration, secure headers (including a tested CSP), origin/CSRF defenses for state-changing cookie-authenticated requests, bounded bodies, endpoint rate limits, safe CORS, and server-side validation/normalization. Protect against mass assignment with allowlists and against IDOR by authorizing each loaded resource and scoping queries.

## Authorization and privacy

Enforce Users -> Roles -> Permissions on the server with deny-by-default and ownership rules. Never rely on hidden UI. Minimize collection and exposure of customer data. Internal notes, contact data, private uploads, pricing configuration, audit internals, and staff records must never reach public responses. Define retention and secure deletion before production.

## Uploads and content

Validate upload purpose, count, size, detected MIME, decoded dimensions, and file integrity; use generated keys and private storage for customer photos. Isolate processing, prevent path traversal and decompression attacks, and consider malware scanning. Sanitize rich content with an allowlist before public rendering; validate links and embeds.

Phase 5 applies these controls to staff-only before-and-after images: matching JPEG/PNG/WebP signature, MIME, and extension; bounded bytes/pixels/dimensions; Sharp re-encoding and metadata removal; generated keys; distinct private/public roots; protected private delivery; and visibility checks for public delivery. SVG is rejected. Customer uploads and malware scanning are not implemented. Storage keys and filesystem paths are excluded from responses and audit metadata.

Phase 6 applies the same content-signature, MIME/extension, byte/pixel, Sharp re-encoding, metadata-removal, generated-key, and traversal defenses to optional guest quote images. They remain under `storage/private/quote-requests`, never move to public storage, and are streamed only through a permission-protected no-store admin route. Guest mutations also require a verified public origin, an expiring one-time draft token stored only as a SHA-256 hash, honeypot validation, minimum completion time, durable source/action throttling, strict schemas, and a unique idempotency key. Confirmation uses a separate 256-bit token stored only as a hash. Public references use a server-generated, cryptographically random 40-bit suffix and are never accepted as public lookup credentials. Malware scanning and the production retention period remain approval gates.

## Secrets, data, and logging

Phase 7 uses independent 256-bit opaque result and quote-transfer credentials stored only as SHA-256 hashes, strict server validation, same-origin mutation checks, durable throttling, hashed idempotency keys, short transfer expiry, and seven-day result expiry by default. Public responses never contain rule values, traces, hashes, internal IDs, or source identifiers. Quote linkage is re-derived from server records and never trusts a client-supplied price or version.

Inject secrets at deployment, grant least privilege, rotate them, and never commit or expose them to browsers/logs. PostgreSQL accounts and networks use least privilege. Logs are structured and correlated but exclude passwords, tokens, secrets, upload content, private pricing, and unnecessary personal data. Audit sensitive actor/action/resource/time/outcome and safe change summaries; make audit records read-only to ordinary admins.

## Infrastructure and recovery

Keep PostgreSQL/private storage off public ports, patch base images/host, run containers without unnecessary privileges, and restrict filesystem/network access. Use encrypted off-host database and media backups, defined retention, restore tests, monitoring, incident contacts, and documented recovery. HTTPS renewal and header checks must be monitored.

## Security verification

Before release: dependency/container scanning, authorization matrix tests, input/fuzz boundary tests, upload tests, CSRF/session review, privacy/data-flow review, restore exercise, secret scan, penetration testing proportional to risk, and remediation tracking.

## Unresolved decisions

MFA policy, password breach screening, malware scanning, encryption-at-rest approach, retention, audit retention, backup RPO/RTO, incident process, and final privacy/legal wording require future approval. Phase 3 fixes the password, session, CSRF, and login-throttle baselines; Phase 5 upload limits are recorded in `before-after-implementation.md`; Phase 6 guest controls and limits are recorded in `quote-request-implementation.md`.
