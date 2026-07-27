# Roles and Permissions

## Purpose

This document defines the authorization model implemented as a Phase 3 foundation. Authorization is always server-enforced and follows `Users -> Roles -> Permissions`; UI hiding is only a usability aid.

## Model

Users may hold one or more roles; roles contain granular permission identifiers. Policies may add ownership and resource-state constraints. Deny access by default. Permission changes and sensitive access should be auditable. Role names are not trusted shortcuts in business logic.

## Super Admin

The Super Admin has full platform administration: users, roles, permissions, services, areas, quote requests, estimator pricing, projects, blog, authors, media, website/SEO settings, redirects, and audit logs. Initial provisioning uses a secure setup or CLI procedure, not registration. Safeguards must prevent disabling, demoting, or deleting the last active Super Admin.

## Admin

“Admin” is a configurable role, not an unconditional bypass. Possible permissions cover quote review/status/notes/uploads, services, areas, projects, pricing rules, posts/publishing/authors/taxonomy, media, and selected settings. Super Admin can grant or remove each capability.

## Author

Authors can create, read, update, preview, publish, and archive their own posts; upload/read appropriate blog media; select categories/tags; manage their own featured images and SEO; and view their publishing history. They cannot access quotes, customers, estimator pricing, users, roles, permissions, system settings, audit logs, or internal notes.

Example identifiers include:

```text
blog.posts.create
blog.posts.readOwn
blog.posts.updateOwn
blog.posts.publishOwn
blog.posts.archiveOwn
media.upload
media.readOwn
```

Additional identifiers should use stable `domain.resource.action[Scope]` naming. “Own” is enforced against persisted ownership, not a client-supplied author ID.

## Enforcement guidance

- Authenticate, load effective permissions, authorize the action and specific resource, then apply allowlisted input.
- Recheck permission inside sensitive use cases even when routes are guarded.
- Scope queries to accessible records to prevent IDOR and metadata leaks.
- Permission-aware navigation never replaces API checks.
- Cache permissions only with reliable invalidation/session revocation after role changes.
- Audit user lifecycle, role/permission assignments, publishing, pricing changes, quote status/notes, private media access where appropriate, and security events.

## Phase 3, Phase 5, Phase 6, and Phase 7 implementation

The foundational catalogue contains admin access; user, role, audit, and own-session keys documented in `authentication-authorization-implementation.md`. Phase 5 adds six `projects.beforeAfter.*` and four `media.beforeAfter.*` keys documented in `before-after-implementation.md`. Phase 6 adds the `quoteRequests.*` keys. `SUPER_ADMIN` always resolves to every known permission. `ADMIN` initially receives only `admin.access`; quote, estimator, and cross-author blog permissions are never granted by default. Multiple roles combine permissions. Final-active-Super-Admin protections use serializable transactions.

Phase 7 adds `pricingVersions.read/create/update/publish/archive/delete`, `pricingRules.read/create/update/delete`, and `estimatorResults.read/readCalculationTrace/archive`. Super Admin receives all known keys. Admin and Author receive no Phase 7 permission by default; a Super Admin may grant selected keys. Pricing publication and trace access remain distinct high-impact permissions.

Phase 8 adds typed `blogPosts.*`, `blogMedia.*`, `blogCategories.*`, `blogTags.*`, `authorProfiles.*`, and `blogRevisions.*` permissions using explicit own/all pairs. Author defaults include `admin.access`; create/read/update/publish/schedule/archive/delete own posts; upload/read/update/delete own blog media; read taxonomy; read/update their own author profile; and read their own revisions. They receive no all-author or taxonomy-management permission. Initialization is additive and idempotent and does not remove existing assignments.

## Phase 9 operational permissions

Phase 9 adds granular `jobs.*` keys covering read/read-assigned, quote/internal creation, update, schedule/reschedule, assignment, lifecycle, completion, cancellation, closing, archiving/deletion, notes, checklist, private media, incidents, calendar, notifications, and conflict override. Super Admin receives all known keys. Admin receives none automatically. Author receives no job or private operational permission. No Worker system role is introduced; least-privilege operational access is assembled through configurable roles.

## Unresolved policy

Later-feature permission catalogues, approval requirements, audit retention, support access, and whether certain pricing or publishing actions need two-person review remain future decisions. Phase 5 project/media and Phase 6 quote-request permissions are no longer unresolved.

Phase 10 adds no business role or permission. Deployment, migration, backup, restore, scheduler,
and environment access are host-operator capabilities outside browser RBAC and must be limited
through Linux, Docker, and file permissions. Super Admin remains an application role, not automatic
VPS or database-root authority.
