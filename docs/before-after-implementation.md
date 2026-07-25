# Before-and-After Implementation

## Scope and status

Phase 5 implements a database-backed CTPS portfolio for staff-managed before-and-after projects. It includes private draft media, protected administration, publication transitions, public gallery/detail pages, a featured homepage project, filters, SEO metadata, and sitemap entries. It does not implement customer uploads, quote requests, pricing, blog publishing, scheduling, or a general-purpose media library.

## Data model

`BeforeAfterProject` stores a unique slug, title, summary, plain-text description, lifecycle status, featured flag, publication/completion timestamps, stable service and service-area keys, SEO overrides, display order, optimistic-lock version, audit ownership, and timestamps. It has dedicated primary Before and primary After media references.

`BeforeAfterProjectMedia` links supporting `BEFORE`, `AFTER`, or `GALLERY` images with deterministic sort order and an optional project-specific caption. A media item cannot appear twice in one project and cannot be shared between projects.

`MediaAsset` stores generated storage metadata, private/public visibility, readiness state, safe original filename, generated filename, processed MIME type, byte size, dimensions, alt text, caption, checksum, uploader, and timestamps. `MediaVariant` stores the generated Original, Large, Gallery, and Thumbnail variants. Database responses map variants to application routes and never expose storage keys or filesystem roots.

## Storage architecture

`LocalMediaStorageService` is the initial provider-neutral adapter. It uses distinct configurable roots:

- `storage/private/before-after` for Draft and Archived project bytes
- `storage/public/before-after` for Published project bytes

The roots are outside both Next.js public directories. Keys are server-generated UUID paths and must match one of four known WebP variant names. The adapter resolves against its configured root, rejects arbitrary filenames and traversal, supports read/write/delete, and moves a complete media directory between visibility roots.

The database is authoritative for visibility. Admin previews call an authenticated API media route and use `private, no-store`. Public delivery succeeds only for a ready asset whose database visibility is `PUBLIC`, uses `nosniff`, and may use immutable caching because generated variant paths do not change. Internal paths are not response fields, authorization tokens, or audit metadata.

## Upload and multiple-image flow

The admin editor accepts multiple JPEG, PNG, or WebP selections and immediately creates local object-URL previews. Client checks provide early type, extension, size, and dimension feedback; the API independently enforces every security constraint. A selected image can be removed before transmission, reordered, categorized, described, and retried after an individual failure. Object URLs are revoked on removal, successful save, and unmount.

Saving processes selected files sequentially so failures are attributable and memory use stays bounded. Each successful upload starts private and can then receive alt text/caption metadata. Project creation/update associates one Primary Before, one Primary After, and up to 12 supporting images. Duplicate use, cross-project sharing, unavailable assets, and duplicate primary roles are rejected. A failed batch or database write removes any files created by that request.

The browser reports per-file states (`selected`, `uploading`, or `failed`) rather than a synthetic byte percentage. Native file selection remains usable without drag-and-drop. Invalid files remain visible with corrective text and are never uploaded.

## File validation and image processing

The API checks:

- a non-empty bounded file list;
- 10 files per upload request;
- 10 MiB per file and 50 MiB combined;
- `.jpg`/`.jpeg`, `.png`, or `.webp` extension matching the declared MIME and magic signature;
- successful Sharp decode;
- oriented dimensions from 600 × 400 through 12,000 × 12,000;
- a bounded input-pixel limit.

SVG and mismatched, corrupt, empty, or unsupported content are rejected. Sharp normalizes orientation, strips source metadata by re-encoding, and creates WebP Original, Large (up to 1,800 px), Gallery (up to 1,100 px), and Thumbnail (up to 480 px) variants at configurable quality. Resize uses `withoutEnlargement`, so small accepted images are not upscaled. Processing failure cleans up generated private variants.

Virus scanning is not included in the local Phase 5 pipeline. Production must add an isolation/scanning decision before customer-originated uploads are ever introduced.

## Project lifecycle

- **Draft:** private, editable, excluded from all public queries and public media delivery.
- **Published:** requires title, summary, description, both primary images, and meaningful alt text for both. Publication moves referenced bytes to the public root and updates media/project state.
- **Unpublished:** returns a Published project to Draft, marks its media private, and moves bytes back to private storage. Public queries and media routes stop serving it immediately.
- **Archived:** excluded from public queries. Publishing an Archived project is rejected. Archiving a Published project also makes its media private.
- **Deleted:** only Draft project records may be permanently deleted. Referenced media must be detached before media deletion; archived/published project deletion is deliberately unavailable.

Slug and media changes on Published projects require unpublishing. Project updates use a version predicate and reject stale edits instead of overwriting them. Public reads use `no-store`, so lifecycle changes require no application cache purge in Phase 5. Immutable media URLs remain safe because unpublication makes the API reject them.

## Authorization and auditing

All admin APIs reuse Phase 3 cookie authentication, session-bound CSRF protection, permission guards, protected BFF routes, and permission-aware navigation. Phase 5 adds:

```text
projects.beforeAfter.read
projects.beforeAfter.create
projects.beforeAfter.update
projects.beforeAfter.publish
projects.beforeAfter.archive
projects.beforeAfter.delete
media.beforeAfter.upload
media.beforeAfter.read
media.beforeAfter.update
media.beforeAfter.delete
```

The idempotent initializer grants every known key to `SUPER_ADMIN`. `ADMIN` and `AUTHOR` retain their approved baseline until a Super Admin deliberately configures a role. UI hiding does not replace API checks.

Audit events cover media upload/update/removal and project create/update/reorder/publish/unpublish/archive/delete. Metadata contains safe identifiers, counts, dimensions, and changed field names; the sanitizer removes credentials, hashes, storage keys, and filesystem-path fields.

## API endpoints

Protected API endpoints:

```text
GET    /admin/before-after-projects
POST   /admin/before-after-projects
GET    /admin/before-after-projects/:id
PATCH  /admin/before-after-projects/:id
DELETE /admin/before-after-projects/:id
PUT    /admin/before-after-projects/:id/media-order
POST   /admin/before-after-projects/:id/publish
POST   /admin/before-after-projects/:id/unpublish
POST   /admin/before-after-projects/:id/archive
POST   /admin/media/before-after
PATCH  /admin/media/before-after/:id
DELETE /admin/media/before-after/:id
GET    /admin/media/before-after/:id/:variant
```

Public endpoints:

```text
GET /public/before-after-projects
GET /public/before-after-projects/:slug
GET /media/before-after/:id/:variant
```

The public list hardcodes `PUBLISHED` and supports pagination, service, service-area, and featured filters. Public detail lookup requires both slug and Published status.

## Admin routes and behavior

- `/before-after` — permission-gated list with search, lifecycle, service, area, and featured filters; protected thumbnails; create action; and honest empty state.
- `/before-after/new` — Draft creation and managed multi-image editor.
- `/before-after/:id` — edit/read-only view based on permissions, lifecycle controls, protected comparison preview, media ordering, content, and SEO.

The editor preserves failed form state, exposes API publication validation, confirms lifecycle/destructive actions, and warns through `beforeunload` when changes are unsaved. Published media controls are disabled until unpublish. A stale `version` returns a conflict requiring refresh rather than silent overwrite.

## Public routes, SEO, and accessibility

- `/before-after` renders only database-published projects, announced result counts, service/area filters, pagination, and an honest empty state.
- `/before-after/:slug` renders a comparison, project copy, service/area links, completion month, and lazy supporting gallery.
- The homepage requests one featured Published project and otherwise displays an honest managed empty state.
- The sitemap fetches all Published project pages and omits Draft/Archived/unpublished records.
- Detail metadata uses approved SEO overrides with title/summary fallbacks, canonical routes, and managed Open Graph media.

The shared comparison supports pointer, touch, keyboard arrows/Home/End, persistent labels, and reduced-motion behavior. Images use separate meaningful alt text and captions stay associated with supporting figures.

## Environment variables and local setup

```text
MEDIA_STORAGE_DRIVER=local
MEDIA_LOCAL_PUBLIC_ROOT=storage/public/before-after
MEDIA_LOCAL_PRIVATE_ROOT=storage/private/before-after
MEDIA_MAX_FILE_BYTES=10485760
MEDIA_MAX_UPLOAD_FILES=10
MEDIA_MAX_PROJECT_SUPPORTING_IMAGES=12
MEDIA_MAX_TOTAL_UPLOAD_BYTES=52428800
MEDIA_MIN_WIDTH=600
MEDIA_MIN_HEIGHT=400
MEDIA_MAX_WIDTH=12000
MEDIA_MAX_HEIGHT=12000
MEDIA_IMAGE_QUALITY=82
MEDIA_PUBLIC_BASE_PATH=/media/before-after
```

Copy `.env.example`, run `pnpm install`, start PostgreSQL, generate Prisma, apply migrations, run `pnpm auth:initialize`, and start the apps. The storage roots are created on demand. Uploaded bytes are ignored by Git; only `.gitkeep` files are committed.

## Future S3-compatible migration

Keep application URLs and database metadata stable while adding another storage adapter. Copy each private/public variant using its generated key, verify byte size/checksum where available, reconcile database records, switch reads behind configuration, retain a rollback window, and delete local bytes only after verified backups. Object storage, signed private delivery, CDN, and lifecycle policies remain future deployment decisions.

## Known limitations, deferred work, and production risks

- Local filesystem moves and PostgreSQL transactions cannot be one atomic transaction. Publish attempts roll moved files back on database failure; an unpublish move failure leaves database visibility private and requires operator recovery.
- There is no background orphan reconciliation, storage-capacity monitor, malware scanner, media retention scheduler, or backup/restore automation yet.
- Upload status is per-file state, not byte-level progress.
- Unsaved-change protection covers browser unload; client-side navigation interception can be improved.
- No production object storage, CDN, Nginx media rule, deployment, or cleanup worker is implemented.
- Operators must back up PostgreSQL and both media roots consistently. Disk exhaustion, permission drift, incomplete moves, and untested restores are production risks for Phase 10.
