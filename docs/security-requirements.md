# Security Requirements

## Purpose

This document establishes minimum controls for the planned system. Specific libraries are deliberately not finalized.

## Identity and sessions

Staff authentication only is confirmed for the initial admin scope; guest quote submission needs no account. Store passwords with a current adaptive password hash and secure reset flow. Use secure, HttpOnly, SameSite cookies where cookie sessions are chosen; rotate identifiers on authentication/privilege change, enforce expiry/revocation, and protect reset/setup tokens. Throttle login and recovery; define lockout that resists denial-of-service. Initial Super Admin setup must be non-public.

## Request protection

Use HTTPS, trusted proxy configuration, secure headers (including a tested CSP), origin/CSRF defenses for state-changing cookie-authenticated requests, bounded bodies, endpoint rate limits, safe CORS, and server-side validation/normalization. Protect against mass assignment with allowlists and against IDOR by authorizing each loaded resource and scoping queries.

## Authorization and privacy

Enforce Users -> Roles -> Permissions on the server with deny-by-default and ownership rules. Never rely on hidden UI. Minimize collection and exposure of customer data. Internal notes, contact data, private uploads, pricing configuration, audit internals, and staff records must never reach public responses. Define retention and secure deletion before production.

## Uploads and content

Validate upload purpose, count, size, detected MIME, decoded dimensions, and file integrity; use generated keys and private storage for customer photos. Isolate processing, prevent path traversal and decompression attacks, and consider malware scanning. Sanitize rich content with an allowlist before public rendering; validate links and embeds.

## Secrets, data, and logging

Inject secrets at deployment, grant least privilege, rotate them, and never commit or expose them to browsers/logs. PostgreSQL accounts and networks use least privilege. Logs are structured and correlated but exclude passwords, tokens, secrets, upload content, private pricing, and unnecessary personal data. Audit sensitive actor/action/resource/time/outcome and safe change summaries; make audit records read-only to ordinary admins.

## Infrastructure and recovery

Keep PostgreSQL/private storage off public ports, patch base images/host, run containers without unnecessary privileges, and restrict filesystem/network access. Use encrypted off-host database and media backups, defined retention, restore tests, monitoring, incident contacts, and documented recovery. HTTPS renewal and header checks must be monitored.

## Security verification

Before release: dependency/container scanning, authorization matrix tests, input/fuzz boundary tests, upload tests, CSRF/session review, privacy/data-flow review, restore exercise, secret scan, penetration testing proportional to risk, and remediation tracking.

## Unresolved decisions

Authentication/session library, MFA requirement, password policy, lockout thresholds, session duration, CSRF pattern, upload limits/scanning, encryption-at-rest approach, retention, audit retention, backup RPO/RTO, incident process, and privacy/legal wording require approval.
