# Roles and Permissions

## Purpose

This document defines the planned authorization model. Authorization is always server-enforced and follows `Users -> Roles -> Permissions`; UI hiding is only a usability aid.

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

## Unresolved policy

Exact permission catalogue, multi-role conflict semantics, session invalidation timing, approval requirements, audit retention, support access, and whether certain pricing or publishing actions need two-person review remain future decisions.
