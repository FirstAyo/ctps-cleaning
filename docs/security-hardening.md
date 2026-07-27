# Security Hardening

## Reviewed controls

Authentication uses Argon2id, one-time Super Admin bootstrap, opaque hashed sessions, idle/absolute expiry, revocation, mandatory password change where set, generic login errors, durable brute-force throttling, and server-side Users → Roles → Permissions. Unsafe staff requests require a session-bound CSRF token. Public quote/estimator mutations repeat origin, possession/idempotency, validation, and throttle checks at the API.

Production uses Secure host-only cookies unless a domain is explicitly justified. Nginx terminates TLS and supplies `X-Forwarded-*`; `TRUST_PROXY_HOPS` prevents trusting arbitrary client forwarding headers. BFF/API correlation IDs accept only 1–64 safe characters or generate a UUID. Correlation is observability context, never identity.

Uploads are allowlisted by workflow, extension, declared MIME, signature, decode, dimensions, pixels, count, per-file and total bytes. Sharp re-encodes/strips metadata. Generated keys and resolved-root validation prevent traversal. Quote/job media stays private; Draft blog/project media is protected; publication alone moves approved managed content public. Malware scanning remains an explicit launch decision.

## Headers and errors

Nginx adds HSTS on HTTPS, nosniff, restrictive referrer/permissions/frame policy, COOP on public pages, Admin noindex, and a CSP. Next.js repeats baseline headers for direct-container defence. CSP allows inline script/style for current Next.js/theme requirements, disallows objects, frames, non-self connections, and insecure upgrades, and must be verified in browser console.

Known application HTTP exceptions retain their stable safe payload plus request ID. Unexpected failures return `INTERNAL_ERROR`; stack traces and exception messages stay server-side. Admin/public error pages do not imply a mutation succeeded.

## Secrets and accounts

Store `.env.production` outside Git with mode `600`. Generate long random passwords; never place credentials in Compose, images, crontab, shell history, tickets, or logs. Prefer separate PostgreSQL runtime, migration, and backup users when operational maturity permits. Runtime needs application DML; migration needs schema rights; backup needs read/lock privileges. Rotate one secret at a time with backup and rollback. Session/cookie changes may revoke staff access.

Bootstrap from a trusted terminal after permissions initialise. The command refuses a second Super Admin. After first use, restrict who can execute deployment tooling and document a recovery process based on database access and audited user administration—never a default credential.

## Host baseline

Create a non-root deployment user; verify SSH-key access before disabling passwords; restrict sudo; patch host/images; allow only SSH, HTTP, and HTTPS inbound; keep database/API/Admin ports private; avoid Docker-socket access for ordinary accounts; and stage firewall changes to avoid lockout. Recommended ownership: deployment tree and media to deployment service group; environment/backups `600`; media directories `750`; logs readable only by operations; Nginx configuration root-owned and not writable by workers.

## Verification

Run dependency audit, repository scan, container scan, header/browser check, authorization tests, private-media denial, CSRF/session tests, upload boundary tests, backup restore rehearsal, and `git diff --check`. Penetration testing, MFA, breach-password screening, malware scanning, encryption-at-rest, retention approval, and formal legal review remain separate decisions.
