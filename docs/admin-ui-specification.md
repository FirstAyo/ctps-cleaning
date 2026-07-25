# Admin Dashboard UI Specification

## Purpose

This specification defines the planned protected dashboard. Clarity, efficiency, privacy, and security take priority over decorative presentation. Permission-aware UI never replaces API authorization.

## 1. Admin shell

Use a collapsible desktop sidebar, mobile navigation drawer, top bar, breadcrumb, page title/actions, user menu, theme toggle, optional actionable notifications, and main content region. The wide layout supports dense work; at medium widths the sidebar collapses to labeled-on-demand icons; at narrow widths it becomes a focus-managed drawer and content becomes one column.

Keyboard users can skip navigation, traverse in visual order, close drawers/menus with Escape, and return focus to triggers. The current route is conveyed beyond color. Page title remains unique. The top bar should not duplicate every page action, and notifications appear only when they support work.

## 2. Sidebar navigation

Potential groups are Dashboard; Quote Requests; Estimates; Services; Service Areas; Before and After; Blog; Authors; Media; Pricing; Users; Roles and Permissions; SEO; Redirects; Audit Logs; Settings. Group and progressively disclose them to avoid a long undifferentiated list.

Render only entries the user may access and preserve direct-link denial behavior. The API independently checks every list, detail, and mutation. Loading permissions should not flash forbidden navigation. Counts/badges must be authorized, useful, and accessible.

## 3. Dashboard home

Possible operational widgets show new requests, requests awaiting review, recent estimator conversions, published/scheduled posts, recent media uploads, recent activity, and system notices. Each has a clear time scope, permission-filtered data, destination, loading/empty/error state, and textual meaning. Avoid decorative charts and counters without a decision or action attached. Never expose customer summaries to roles without quote permission.

## 4. Data tables

Align text left, numeric values consistently, and actions at the trailing edge. Provide scoped search, labeled filters, explicit sort state, bounded pagination, result totals, optional bulk selection, row actions, status badges, and clear reset. Sticky headers are allowed when headers remain associated with cells.

Tables need captions or equivalent accessible names, semantic headers, keyboard-operable controls, selected-row announcements, and status text/icons in addition to color. Loading uses stable rows; empty distinguishes “no records” from “no filter matches”; error allows retry. On narrow screens, preserve meaning with horizontal scroll plus cues or deliberate record cards—never hide critical columns silently. Bulk actions state count/scope and require permission and confirmation proportional to impact.

## Phase 5 before-and-after administration

The implemented `/before-after` list is permission-gated and supports search, lifecycle, service, area, featured filters, protected thumbnails, totals, and an empty state. Create/edit routes support Draft content, multiple local previews, removal before upload, ordering, Primary Before/After roles, supporting categories, alt text, captions, protected comparison preview, SEO, optimistic conflicts, and explicit publish/unpublish/archive/delete actions. Published media/slug edits require unpublishing. Lifecycle mutations are confirmed and unsaved browser unload is warned. API permission and CSRF enforcement remain authoritative.

## 5. Quote-request management

The list supports reference, received date, customer summary only where permitted, requested services, area, status, assignee if later approved, and filters. Detail view separates customer/contact, property, services/answers, estimator context, private uploaded photos, preferred dates, consent, status timeline, internal notes, activity, and contact actions.

Private images use authorized delivery and do not leak durable public URLs. Internal notes are visibly marked staff-only. Status changes show allowed transitions and record actor/time; destructive actions require confirmation. Permission policies may separately govern list/read, customer data, uploads, notes, status, export, and delete. Public components must never be reused with hydrated private details.

## 6. Pricing-management UI

Provide service selector, active/inactive/effective filters, typed rule list, and editor for range values, effective dates, priority, active state, and supported adjustment type. A preview runs representative validated inputs through the same server calculation engine and labels its rule version.

Show validation warnings for min/max inversion, date overlap, conflicts, missing dependencies, unsupported values, and boundaries. Before saving major changes, present old/new summary, affected service/date, preview delta, audit reason if required, and confirmation. Show creator/editor/time/version audit context. Never expose free-form executable formulas, JavaScript, SQL, or internal configuration to unpermitted roles.

## 7. Blog dashboard

The post list supports status, author, category, search, date, Create Post, and views for drafts, scheduled, published, and archived. Actions are ownership/permission-scoped. The editor route, not a modal, is the primary work surface. Preview, schedule, publish, archive, and revision history have explicit states. Publish/schedule confirmations summarize visibility and timing. Authors see and manage their own content according to `roles-permissions.md`.

## 8. Blog editor

Use a desktop-first responsive layout: main canvas for title, slug, excerpt, and rich content; side panel for featured image, category/tags, author (only when permitted), publication controls, SEO, Open Graph, preview, and revisions. On small screens, side sections become ordered accordions below primary fields rather than stacked modals.

Show save state (saving/saved/error), field validation, sanitized preview, schedule timezone, and unsaved-change protection on navigation/close. Revision comparison is readable and restores only after confirmation. Primary editing should not depend on excessive dialogs. The editor never trusts raw rendered HTML.

Phase 8 implements a focused responsive structured-block canvas with lifecycle, slug, taxonomy, featured/inline managed images, SEO, and separately loaded revision history. Media includes multi-file local preview, per-file upload state/retry, ordering, alt text, captions, insertion, detach, and referenced-deletion safeguards. Explicit save/error/conflict states and browser unsaved-change protection are present; authenticated Draft preview is noindex and no-store. Revision restore and a general media library remain deferred.

## 9. Media library

Support grid and list views, upload, search, filters, file type, size, dimensions, uploader/date, purpose, public/private classification, preview, alt text, caption, usage references, and justified bulk selection. Private thumbnails use authorized access and obvious privacy labels.

Upload shows constraints, progress, processing, success, and per-file errors. Deletion first checks usage and retention, lists affected references, and requires confirmation; replacing an asset should preserve or deliberately update relationships. Do not expose storage keys or make private media public through a toggle without elevated permission and explicit warning.

## 10. User and permission management

User list/detail includes verified identity fields, account status, role assignments, last activity when policy allows, and security actions. Role screens group permissions by domain, support create/edit, identify changed grants/removals, and show affected users before save. Do not present a misleading simple “Admin” toggle.

Sensitive changes require reauthentication or confirmation when policy demands and create audit events. The system blocks disabling/demoting/deleting the final active Super Admin, including concurrent attempts. Permission matrix cells have accessible row/column context, non-color state, keyboard operation, and a readable small-screen alternative.

## 11. Audit-log UI

Audit logs are read-only and show actor, action, resource/type/reference, timestamp/timezone, outcome, and safe old/new summaries. Provide date, actor, action, resource, and outcome filters plus search that does not reveal restricted payloads. A detail drawer displays correlation/context and redacted structured differences. Ordinary users cannot edit/delete logs; visibility itself is permission-controlled.

## 12. Admin forms

Group fields by task with headings and descriptions. Use a sticky action bar only for long forms and ensure it does not cover content. Standard actions are Save, Save and Continue when meaningful, Cancel, and permission-gated Delete. Destructive styling is reserved for destructive actions.

Provide inline validation and a focusable linked summary after submit; distinguish validation, authorization, conflict, and server errors. Preserve input on failure. Warn on unsaved navigation. Use optimistic updates only for low-risk reversible actions with reliable rollback; pricing, permission, status, publishing, and destructive operations await server confirmation.

## 13. Admin states

Phase 7 adds permission-aware Pricing and Estimator Results navigation. Pricing versions use structured service and rule fields—never a formula editor—with immutable Published/Archived states and explicit publish/archive/delete boundaries. Calculation traces appear only with their dedicated permission.

- **Loading:** stable shell/table/form skeleton and announced busy region.
- **Empty/no data:** explain whether the system has no records or filters excluded them, then offer a permitted action.
- **Error:** actionable retry and safe correlation reference; no stack trace.
- **Permission denied:** state that access is unavailable without revealing record existence or data.
- **Session expired:** protect unsaved input where safe, prompt reauthentication, and avoid duplicate mutation.
- **Validation failed:** summary plus field messages, values retained.
- **Save success:** precise toast/inline confirmation with record state.
- **Conflict/changed elsewhere:** compare current and submitted state, offer refresh/reapply where safe, never silent overwrite.

## 14. Admin animation strategy

Allowed motion is brief sidebar/drawer, toast, expand/collapse, loading, row feedback, and tab transitions. Prefer CSS and preserve focus. Avoid parallax, decorative counters, complex page transitions, autoplay, and motion that slows operational tasks. Reduced-motion mode removes nonessential transforms and uses immediate transitions.

## Security and acceptance constraints

Never include secrets, private customer data, upload URLs, internal notes, or pricing configuration in a response solely because the route is hidden. Test the permission matrix at API and UI layers, keyboard tables/dialogs/drawers, focus restoration, screen-reader labels/statuses, theme contrast, zoom/reflow, destructive confirmations, stale-record conflicts, session expiry, and all loading/empty/error states before release.
