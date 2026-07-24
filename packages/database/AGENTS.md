# Database Package Guidance

## Purpose

This package will own the Prisma schema, migrations, generated client integration, and persistence primitives.

## Rules

- Model referential integrity explicitly, including on-delete and on-update behavior. Add indexes based on real query and uniqueness needs.
- Use consistent timestamps and auditable actor/version fields for sensitive records. Use soft deletion only when retention or recovery needs justify its complexity.
- Use database decimal or integer-minor-unit representations for money; never rely on binary floating point.
- Classify private customer fields and keep access paths explicit.
- Keep business and authorization logic outside database-access code.
- Create additive, reviewable, backup-aware migrations. Avoid destructive migrations; use expand/backfill/verify/contract for risky changes.
- Never edit a migration already applied to production. Create a corrective migration instead.
- Before schema changes, plan backup, restore, rollback/forward recovery, locking, data conversion, and deployment ordering.
