# Admin Application Guidance

## Purpose

This directory is reserved for the protected admin application. Follow the root `AGENTS.md` and `docs/admin-ui-specification.md`.

## Rules

- Treat the dashboard as staff-only. Every read and mutation requires server-side authentication and permission enforcement.
- Navigation and controls should be permission-aware, but hidden UI is not authorization. Never expose data beyond the current user's permissions.
- Use clear, accessible tables, forms, drawers, and dialogs with keyboard support, focus management, captions, status text, and non-color cues.
- Validate on client for usability and on the server for trust. Preserve user input after recoverable errors.
- Protect unsaved work; show conflicts when another user changed a record.
- Require explicit confirmation for destructive or high-impact actions and prevent accidental removal of the final Super Admin.
- Quote management must protect customer details, photos, internal notes, and contact history.
- Pricing management may edit typed, validated configuration only; never offer executable formulas. Show previews, change summaries, effective dates, and audit context.
- Blog management must enforce author ownership and permissions while allowing authorized authors to publish their own posts.
- Media, user, role, permission, and content mutations must be auditable where required.
- Keep animation minimal and operational. Do not let optimistic UI imply that a sensitive change succeeded before server confirmation.
