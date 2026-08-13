# Security Requirements

## Phase 12 SEO safety

Draft, preview, token, and staff content remains noindex, no-store where private, absent from sitemap, and protected by its original authorization boundary. JSON-LD uses typed builders and escaping rather than raw Admin-authored script. The SEO audit requires `seo.view`, queries Published metadata only, exposes no storage keys/private fields, and makes no outbound request. Robots remains crawl guidance, never access control. Canonical origin and index enablement are environment-controlled.

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

Phase 8 stores only strict structured blocks and managed-media identifiers. Unknown fields, raw executable HTML patterns, unsafe URL schemes, external image fields, invalid slugs, and unsupported blocks are rejected at the trusted API boundary. Post/media/profile ownership and own/all permissions are rechecked server-side; Draft/Scheduled content and media have no public API. Optimistic versions reject stale saves, public queries force Published status, and audit metadata excludes article bodies and filesystem keys. See `blog-implementation.md`.

Inject secrets at deployment, grant least privilege, rotate them, and never commit or expose them to browsers/logs. PostgreSQL accounts and networks use least privilege. Logs are structured and correlated but exclude passwords, tokens, secrets, upload content, private pricing, and unnecessary personal data. Audit sensitive actor/action/resource/time/outcome and safe change summaries; make audit records read-only to ordinary admins.

Phase 9 job routes are authenticated and permission-scoped, with read-assigned checks, strict schemas, optimistic versions, legal transitions, cryptographically random references, server-derived UTC timestamps, and recorded conflict overrides. Job snapshots, notes, assignments, incidents, activity, and media have no public API. Images remain private-only and every delivery is authorized/no-store. Audit/outbox metadata excludes customer contact/address, internal bodies, paths, and tokens. See `jobs-scheduling-implementation.md`.

## Infrastructure and recovery

Keep PostgreSQL/private storage off public ports, patch base images/host, run containers without unnecessary privileges, and restrict filesystem/network access. Use encrypted off-host database and media backups, defined retention, restore tests, monitoring, incident contacts, and documented recovery. HTTPS renewal and header checks must be monitored.

## Security verification

Before release: dependency/container scanning, authorization matrix tests, input/fuzz boundary tests, upload tests, CSRF/session review, privacy/data-flow review, restore exercise, secret scan, penetration testing proportional to risk, and remediation tracking.

Phase 10 adds explicit proxy-hop trust, bounded correlation IDs, structured production request
logs, sanitised unknown-error responses, HTTPS-only production environment validation, safe
liveness/readiness/storage probes, Nginx security headers, non-root application images,
internal-only database/API networking, secret/static scans, and guarded backup/restore tooling. CSP
retains documented `unsafe-inline` script/style exceptions for Next.js and the pre-paint theme
initializer; it never enables `unsafe-eval` and requires browser verification.

## Unresolved decisions

MFA policy, password breach screening, malware scanning, encryption-at-rest approach, retention, audit retention, backup RPO/RTO, incident process, and final privacy/legal wording require future approval. Phase 3 fixes the password, session, CSRF, and login-throttle baselines; Phase 5 upload limits are recorded in `before-after-implementation.md`; Phase 6 guest controls and limits are recorded in `quote-request-implementation.md`.

Phase 11 marketing input uses strict structured schemas: no arbitrary HTML, script, style, iframe, external-media URL, JavaScript URL, or client-selected route/key. Public APIs expose Published snapshots only. Draft preview requires authentication and permission and is noindex/no-store. Public-media keys are generated, path-contained, signature checked, re-encoded, and separate from all private namespaces; referenced assets cannot be deleted.

Phase 11.1 keeps all public-media mutation and metadata-list routes behind session authentication, CSRF on mutations, and granular `mediaLibrary.*` permission guards. The Admin BFF permits only explicit list/detail/usage/upload/update/archive/restore/delete shapes; it is not an arbitrary proxy. Upload acceptance requires agreement among allowlisted extension, MIME, signature, successful bounded Sharp decode, dimensions, per-file size, batch size, and upload count. UUID storage keys and containment checks prevent filename traversal; safe errors never expose roots or keys. WebP re-encoding auto-orients and drops EXIF, GPS, device data, and raw input bytes.

Public delivery accepts only a UUID and known variant kind, returns `nosniff` plus immutable caching, and can continue serving archived assets already referenced by Published content. Normal selection accepts Ready assets only. Quote, job, Blog-draft/private, and Before & After private namespaces are not queried by the Public Media service. Private operational media can become public only through a future explicit consent/editorial-copy workflow; lifecycle flags must never be flipped in place.

## Phase 11.3 structured Blog editing

The rich editor is not a trusted content boundary. Client output is converted to the CTPS structured-block vocabulary and revalidated by the API. Unsupported nodes or marks, duplicate marks, arbitrary HTML, scripts, event-handler markup, iframes/embeds, external image sources, and dangerous `javascript:`, `data:`, or `vbscript:` links are rejected; approved links are relative paths or HTTP(S) URLs and public external links receive safe relationship attributes. Paste handling strips executable container/attribute markup before conversion, while server validation remains definitive.

Blog media listing, upload, mutation, streaming, post attachment, publication, and revision restoration retain authentication, CSRF on mutations, explicit BFF shapes, own/all permission checks, randomized managed keys, path containment, and private no-store responses. Revision restore accepts only an existing revision of the authorized post, revalidates its snapshot, taxonomy, and media, checks the optimistic post version and slug uniqueness, creates a new immutable revision, and records safe identifiers rather than article content. No keystroke or editor document is written to audit logs.
