# Phase 8 Blog and Content Publishing Implementation

## Scope and architecture

Phase 8 replaces the static blog placeholder with a PostgreSQL-backed editorial system. The NestJS API owns validation, authorization, lifecycle transitions, search, revision snapshots, media state, scheduling, and audit events. The protected Next.js admin consumes authenticated APIs through its same-origin BFF. The public Next.js application reads only the `public/blog/*` API surface. No comments, customer accounts, newsletter, hosted CMS, external image fields, arbitrary HTML, or article-generation feature is included.

## Lifecycle and ownership

Posts use `DRAFT`, `IN_REVIEW`, `SCHEDULED`, `PUBLISHED`, and `ARCHIVED`. Creation always produces a Draft. Explicit server actions submit for review, publish, unpublish to Draft, schedule for a future offset-aware time, archive, or permanently delete a Draft. `publishedAt`, `scheduledFor`, and `archivedAt` record lifecycle facts. An integer `version` supports optimistic concurrency; stale saves and lifecycle actions return a conflict instead of overwriting work.

Every post has an immutable `authorUserId`. Own/all permission pairs are enforced in the API on reads and mutations, and unauthorized cross-author IDs are concealed as not found. Authors receive the approved own-post, own-media, taxonomy-read, own-profile, and own-revision permissions. They receive no quote, estimator, project, role, or all-author privileges. Admin remains configurable; Super Admin receives all registered permissions.

## Data model and revisions

The additive Phase 8 migration creates `BlogPost`, `BlogPostRevision`, `BlogCategory`, `BlogTag`, `BlogPostCategory`, `BlogPostTag`, `BlogMediaAsset`, `BlogMediaVariant`, `BlogPostMedia`, `AuthorProfile`, and `BlogSlugRedirect`, plus lifecycle/content/media enums. Unique constraints protect current and historical slugs, normalized taxonomy names, join records, media variants, author slugs, and revision numbers. Indexes cover status, author, publication/schedule time, search text, and joins.

A complete content/SEO/taxonomy snapshot is created on initial creation and every meaningful save. Revision history is shown separately in the editor and is not loaded into the post-list query. Restoration is intentionally deferred: historical records are immutable and never republish content automatically.

## Safe content editor

Content is strict structured JSON, not HTML or unrestricted Markdown. Supported blocks are paragraph, heading 2, heading 3, bullet list, numbered list, blockquote, safe link, managed image, callout, and divider. The trusted validation boundary rejects unknown block fields, raw executable HTML patterns, `javascript:` and non-HTTP(S) external schemes, reserved/invalid slugs, unsupported blocks, and image URLs. Public rendering creates React elements directly and adds `noopener noreferrer` to external links.

The client editor provides explicit Draft saving, block insertion/removal/reordering, taxonomy selection, SEO fields, publish/schedule/archive confirmations, optimistic-conflict feedback, and browser unsaved-change protection. Autosave is not used. The authenticated noindex preview renders private managed media and is never exposed by a public Draft API.

## Managed images and privacy

Blog media uses distinct `storage/private/blog` and `storage/public/blog` namespaces, generated UUID directories, and deterministic WebP filenames. JPEG, PNG, and WebP inputs must have matching extension, MIME, and signature; SVG, GIF, PDF, HTML/XML, executables, corrupt images, and out-of-bound dimensions are rejected. Sharp decodes, auto-orients, strips metadata through re-encoding, avoids upscaling, and produces normalized original, featured, article-large, article-standard, and thumbnail variants. Partial processing is removed on failure.

The editor supports multi-file selection, local previews, per-file state, retry after failure, pre-upload removal, ordering, alt text, captions, featured selection/replacement, inline references, detaching, and deletion of unused assets. Referenced deletion is blocked. Upload ownership is server checked; cross-author reuse is denied unless an explicit all-media permission applies.

Draft and Scheduled assets remain PRIVATE and are streamed only through authenticated, permission-checked, `no-store` routes. Publication moves referenced assets to public storage and changes visibility. Unpublish/archive revokes public access only when no other Published post or meaningful public author profile still references an asset. Public delivery checks database visibility, returns the recorded content type and `nosniff`, and uses public caching. Storage keys and filesystem paths are absent from API and audit responses.

## Publishing, scheduling, and audit

Publication requires a title, excerpt, valid non-empty content, public author display profile, featured image, at least one category, alt text for important media, safe SEO fallbacks, and intact managed image references. Publication moves media, sets lifecycle timestamps, and records an audit event. Published slug changes create a durable old-slug record; the public route issues a permanent redirect and prevents historical URL breakage.

`pnpm blog:publish-due` is a VPS-compatible durable CLI suitable for cron or a systemd timer. It processes a configurable bounded batch, revalidates each due Scheduled post, uses a conditional Scheduled-and-due database update so repeated/concurrent runs cannot record duplicate publication, moves media, records safe audit metadata, skips invalid posts, and prints examined/published/invalid totals. Production cron/systemd configuration is Phase 10 infrastructure and is not created here.

Audit actions cover post creation/update/revision, review submission, schedule/publish/unpublish/archive/delete, media upload/update/delete, taxonomy changes, and author-profile changes. Metadata contains identifiers and safe change summaries, never article bodies, storage paths, credentials, or tokens.

## Taxonomy and authors

Categories are curated records with name, slug, description, and derived Published count. Tags have controlled names/slugs and Published count. Normalized-name and slug constraints prevent case variants. Referenced taxonomy records cannot be deleted. Authors may select existing values; only separately permitted staff can create, edit, or delete taxonomy.

Public author profiles contain only display name, slug, bio, optional managed profile image, and derived Published posts/count. Staff email, roles, internal user IDs, phone, address, and invented biographies are never returned publicly. An author can update only their profile unless granted `updateAll`.

## Public routes, discovery, and caching

- `/blog` lists only Published/due posts with search, category/tag filters, pagination, accessible empty states, responsive cards, managed featured images, author, date, and deterministic approximate reading time.
- `/blog/[slug]` renders semantic structured content, captions, taxonomy, author context, breadcrumbs, and deterministic related Published posts.
- `/blog/category/[slug]`, `/blog/tag/[slug]`, and `/blog/author/[slug]` expose only meaningful Published archives.
- `/blog/feed.xml` emits Published titles, canonical links, excerpts, and dates without private media or full internal content.
- `/sitemap.xml` includes Published articles and only categories/tags/authors with Published content.

Public reads currently use the repository's consistent `no-store` API strategy, so publication changes become visible without stale cache invalidation. Private/admin/preview reads are also `no-store`. Canonical, Open Graph, Twitter, BreadcrumbList, and BlogPosting metadata uses only confirmed public values, managed featured media, actual dates, and CTPS publisher context.

Search is bounded and performs case-insensitive PostgreSQL matching over title, excerpt, and server-derived plain text from structured content. It never evaluates regex/database syntax and always filters to Published/due records. Related results share categories or tags, exclude the current post, use deterministic date/ID ordering, and are limited to three.

## Accessibility and responsive behaviour

Forms use labels, semantic fieldsets, status text, keyboard-operable native controls, visible confirmation steps, and responsive grids. Public pages use article/heading/list/figure/figcaption/nav semantics, scalable images, wrapping taxonomy chips, and layouts that stack at narrow widths. Status is written as text rather than communicated by colour alone.

## Environment and local operation

Phase 8 variables are documented in `.env.example`: feature flag, private/public roots, file/count/total/dimension/quality limits, scheduler batch size, search maximum, and public/admin page sizes. No blog variable is browser-public and no new dependency was added.

Local workflow:

1. `pnpm db:start`
2. `pnpm db:generate`
3. `pnpm db:migrate`
4. `pnpm auth:initialize`
5. Start API, web, and admin with `pnpm dev`.
6. Run due publishing with `pnpm blog:publish-due`.

Do not create fake Published articles or commit runtime media. Test fixtures and runtime-verification records must be removed after verification.

## Known limitations and deferred work

- Revision restore is optional and deferred; history is read-only.
- Autosave, rich inline text spans, tables, code blocks, arbitrary embeds, public comments, newsletter, and a general page CMS are intentionally absent.
- Full-text indexes, external search, shared cross-owner media workflows, a standalone media library, malware scanning, CDN/object-storage cutover, and production scheduling/monitoring are deferred.
- Local filesystem moves and PostgreSQL cannot form one atomic distributed transaction. Conditional publication prevents duplicate state changes; production operations should monitor and reconcile the extremely small file/database failure window.
- Production cache/CDN policy, backup/restore, cron/systemd unit, and deployment remain Phase 10 work.
