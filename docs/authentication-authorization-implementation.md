# Authentication and Authorization Implementation

## Scope and architecture

Phase 3 implements staff-only identity and administration. The NestJS API is the authoritative authentication and authorization boundary; the Next.js admin application validates identity with `GET /auth/me`, forwards the HttpOnly cookie server-side, and uses same-origin route handlers for browser mutations. There is no public registration, customer identity, OAuth, magic-link, or browser token storage.

## Passwords and initial access

Passwords are accepted at 12–128 characters without composition rules or truncation and are hashed with Argon2id through `@node-rs/argon2`. Parameters are 19,456 KiB memory, two iterations, one lane, and 32 output bytes (the OWASP minimum Argon2id profile selected for the current VPS baseline). The encoded hash contains a unique implementation-generated salt. Passwords and hashes are never returned by normal selections or logged.

Run `pnpm auth:initialize` after migrations to transactionally upsert system roles, foundational permissions, and default assignments. Run `pnpm auth:bootstrap-super-admin` from a trusted terminal for the initial account. The bootstrap uses masked password prompts, validates and normalizes input, asks for confirmation, refuses an existing Super Admin or duplicate email, creates no default credentials, and records a safe audit event. It is deliberately separate from the idempotent role/permission initializer.

Authorized user creation and administrator password reset generate a random temporary password and return it exactly once. The hash alone is persisted. The account must change the password before other protected API access; changing it verifies the current password, prevents reuse, clears the flag, revokes every session, creates a replacement session, and records an audit event.

## Session lifecycle and cookies

Login creates a 256-bit random opaque token. Only its SHA-256 digest is stored in PostgreSQL; the raw token exists only in the `ctps_admin_session` cookie and is never exposed in a response body, URL, browser storage, or log. Session validation rejects revoked, absolute-expired, idle-expired, missing-user, and disabled-user sessions. Activity expiration is extended no more frequently than the configured update interval. A periodic service removes expired sessions, old revoked sessions, and expired throttle records.

Cookies are `HttpOnly`, `SameSite=Lax`, scoped to `/`, have explicit expiry, and are cleared with matching attributes. `Secure` is required by environment validation in production. Local development omits a domain so `localhost:3001` and `localhost:4000` work; production may set a shared parent domain when the admin and API are HTTPS subdomains. Expected public, admin, and API hostnames remain deployment configuration rather than hardcoded names.

Default idle and absolute limits are eight hours and seven days. Users can view safe session summaries, revoke a selected owned session, revoke all other sessions, and explicitly log out. Account disable and administrator password reset revoke every active session.

## CSRF and login throttling

`GET /auth/csrf` generates a fresh random synchronizer token and stores only its SHA-256 digest on the authenticated session. Every authenticated `POST`, `PUT`, `PATCH`, and `DELETE` must provide the raw value in `X-CSRF-Token`; the guard compares the digest with constant-time primitives. Safe methods and the deliberate public login endpoint are excluded. The admin BFF fetches CSRF material server-side immediately before mutations, so client JavaScript never reads the session cookie.

Login uses a durable PostgreSQL fixed-window throttle keyed by a SHA-256 digest of normalized email plus trusted request source. The default is eight failures per 15 minutes. Unknown, wrong-password, disabled, and throttled attempts use the same generic authentication response, and no permanent account lockout exists.

## Data and authorization

Prisma models are `User`, `Role`, `Permission`, explicit `UserRole`, explicit `RolePermission`, `Session`, `AuditLog`, and the small durable `LoginThrottle` support model. IDs are UUIDs. Join uniqueness, session lookup/expiry, audit filter/recent-first, account status, and throttle indexes are included in the reviewed Phase 3 migration.

The shared `packages/permissions` package owns typed role and permission constants and pure combination/check helpers. The API authentication guard establishes identity; a separate metadata decorator and permission guard enforce all management routes. Missing identity returns 401 and insufficient permissions return 403. Navigation hiding is usability only.

System roles are `SUPER_ADMIN`, `ADMIN`, and `AUTHOR`. Super Admin effective access is derived as every known permission and cannot be manually reduced. Disabling or removing the role from the final active Super Admin is checked in serializable transactions. Admin and Author initially receive only `admin.access`; later feature permissions are intentionally absent.

Phase 3 permissions are `admin.access`, `users.read`, `users.create`, `users.update`, `users.disable`, `users.assignRoles`, `roles.read`, `roles.create`, `roles.update`, `roles.assignPermissions`, `audit.read`, `sessions.readOwn`, and `sessions.revokeOwn`. Multiple roles form a union. User creation requires both create and role-assignment authority so it cannot bypass role controls.

## API and admin integration

Authentication routes are `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/change-password`, `/auth/csrf`, `/auth/sessions`, `/auth/sessions/:sessionId`, and `/auth/sessions/revoke-others`. Management routes cover paginated/searchable staff users, profile updates, role assignment, disable/reactivate, temporary-password reset, roles, grouped permissions, permission assignment, and read-only filtered/paginated audit logs.

The admin routes `/dashboard`, `/account`, `/users`, `/users/[id]`, `/roles`, `/roles/[id]`, and `/audit-logs` validate the authoritative API session before protected rendering. Mandatory password change redirects to `/change-password`. Production navigation contains only implemented routes allowed by effective permissions. Direct forbidden visits render a non-disclosing permission state, while the API independently denies the request.

Audit records capture actor, action, resource, time, and recursively sanitized metadata. Keys suggesting passwords, temporary passwords, cookies, authorization, session/CSRF tokens, secrets, or hashes are removed. Audit logs have no mutation endpoint.

## Environment variables

- `AUTH_SESSION_COOKIE_NAME` — default `ctps_admin_session`.
- `AUTH_SESSION_COOKIE_DOMAIN` — blank on localhost; deployment-specific shared domain when needed.
- `AUTH_COOKIE_SECURE` — `false` only for local HTTP and required `true` in production.
- `AUTH_SESSION_IDLE_SECONDS` — default 28,800.
- `AUTH_SESSION_ABSOLUTE_SECONDS` — default 604,800.
- `AUTH_ACTIVITY_UPDATE_SECONDS` — default 300.
- `AUTH_SESSION_CLEANUP_SECONDS` — default 3,600.
- `LOGIN_THROTTLE_WINDOW_SECONDS` — default 900.
- `LOGIN_THROTTLE_MAX_ATTEMPTS` — default 8.
- Existing `ADMIN_URL`, `API_URL`, `DATABASE_URL`, and `CORS_ALLOWED_ORIGINS` remain authoritative.

No extra token or CSRF secret is required because high-entropy random values are stored only as one-way session-bound hashes.

## Assumptions, limitations, and hardening

The throttle is durable but uses a fixed window; a future multi-region deployment may adopt a shared rate-limit service. Immediate permission changes take effect on the next API request because effective permissions are loaded during session validation. Audit retention, operator alerts, device labels, CSP/security headers, password breach screening, and security-event monitoring remain deployment-policy work. MFA is deliberately deferred and is recommended first for Super Admins. Email-based password recovery is deliberately deferred; authorized administrator temporary-password reset is the Phase 3 recovery path. Before production, complete penetration testing, secret/dependency scanning, HTTPS and proxy validation, backup/restore testing, and formal audit retention decisions.
