# Media Strategy

## Purpose

This document defines a provider-neutral plan for service, blog, author, project, Open Graph, and customer-upload media. Phase 4 introduced committed development illustrations. Phase 5 adds managed before-and-after storage. Phase 6 adds a separate, private-only customer quote upload workflow. Phase 11 and 11.1 implement the dedicated Public Media Library for controlled marketing-page photography.

## Phase 4 local assets

Public marketing illustrations are organized under `apps/web/public/images` and referenced through local root-relative paths with Next.js image handling. They contain no customer data, third-party watermarks, or external URLs and are labeled as development demonstrations where project meaning could otherwise be inferred. Approved CTPS photography may replace these stable references later. The quote-photo presentation is static and implements no file picker, object URL, upload, persistence, or API call.

## Classification boundary

- **Public media:** approved marketing/content assets intended for public delivery.
- **Private media:** Draft/Archived project media, customer quote-request uploads, and restricted staff assets. These are private by default and never placed beneath a publicly served path.

Phase 5 project uploads begin in `storage/private/before-after`, move to the distinct public root only on publication, and return to private storage on unpublish/archive. Admin preview and public delivery are application routes that recheck authorization/visibility. See `before-after-implementation.md` for exact variants and limits.

Phase 6 quote uploads use `storage/private/quote-requests` and a quote-specific metadata model. An expiring request draft owns files before submission; a transaction transfers ready files to the resulting quote request. Removed draft uploads are deleted immediately. Quote files never become public and have no public URL; authorized staff view the generated WebP preview through a no-store route. See `quote-request-implementation.md`.

Phase 8 blog uploads use isolated `storage/private/blog` and `storage/public/blog` roots and blog-specific metadata/references. Draft and Scheduled images remain private. Publication creates public visibility; unpublish/archive returns an asset to private storage only when no other Published post or meaningful public author profile references it. Variants are normalized WebP `original`, `featured`, `article-large`, `article-standard`, and `thumbnail` files under generated UUID directories. Blog assets are never sourced from quote requests or before-and-after storage. See `blog-implementation.md`.

Phase 9 operational photos use the separate `storage/private/jobs` namespace. They remain private for every lifecycle state, are re-encoded into managed WebP variants, and are streamed only after job and private-media authorization. There is no public job-media route or automatic portfolio transfer. Future marketing reuse requires a distinct consent-reviewed copy workflow. See `jobs-scheduling-implementation.md`.

Metadata should record owner/uploader, classification, purpose, original name (safely handled), detected MIME type, byte size, dimensions, checksum, storage key/provider, alt text/caption where relevant, variants, references, timestamps, and lifecycle status. Do not expose internal storage keys as authorization.

## Upload pipeline

Authorize purpose and owner, limit count/size, inspect content rather than trusting extensions or headers, decode images safely, validate dimensions, generate randomized keys, strip risky metadata where appropriate, and isolate processing. Phase 5 implements these controls for staff before-and-after JPEG/PNG/WebP uploads. Phase 6 implements them for guest quote images, but malware scanning remains unresolved before production approval.

Generate responsive sizes and WebP/AVIF where practical while retaining an appropriate source. Prevent decompression bombs and unbounded processing. Public output needs width/height, suitable loading priority, and alt-text workflows; before/after pairs require separate accurate alt text.

## Access and deletion

Public assets may be cached at stable URLs after publication. Private bytes require authenticated, authorized streaming or short-lived signed access and non-public caching rules. Admin previews must use the same authorization boundary.

Track usage before deletion. Referenced assets should be blocked from deletion or require a deliberate replacement workflow. Private deletion follows approved retention/legal requirements and audit policy; backups mean deletion may not be instantaneous.

## Storage evolution

Initial development/VPS storage uses separate configurable public/private roots behind an adapter; production volume, backup, and permissions design remains Phase 10 work. Metadata and application URLs do not depend on disk paths. Migration to Cloudflare R2, Backblaze B2, MinIO, or another S3-compatible provider should copy by checksum, verify, switch reads gradually, retain rollback, then retire old bytes after reconciliation.

## Phase 11.2 page-media mapping

Fixed marketing-page Heroes, service catalogues, media/text compositions, supporting images, related-service visuals, and CTAs reuse Public Media. Heroes use `hero`, large compositions use `large`, compact tiles use `card`, and Admin uses `thumbnail`. Focal points follow assets; contextual item alt text may override the default.

Selected proof stores Published Before & After identifiers without copying bytes. Blog images remain Published Blog media. Quote uploads, job photos, customer data, Draft Blog media, and private Before & After media remain ineligible.

## Operations

Back up media off-host, test restores, monitor capacity and failed processing, and reconcile orphaned records/objects. CDN choice, quotas, retention, acceptable MIME types, transformations, virus scanner, storage provider, and migration threshold remain unresolved.

## Phase 11.3 Blog editor media flow

The post editor's bounded, searchable picker contains only Ready Blog media allowed by the writer's own/all permissions; it never searches Public Marketing, Quote, Job, or Before & After storage. Writers may upload through the existing protected Blog pipeline, edit alt text and optional caption, choose standard/wide/full-reading-width layout, replace/remove an image, or move the selected block up/down without drag-only interaction. The editor persists the managed Blog media identifier and presentation metadata, never a filesystem path, binary, arbitrary URL, or original full-resolution payload.

Draft Blog media continues to stream only through the authenticated no-store Admin boundary. Publication, unpublication, archive, scheduled publication, and revision restoration reuse the existing Blog media lifecycle and reference synchronization. Public `figure`/`figcaption` rendering resolves only media attached to a Published post. A featured image is selected separately in post settings but follows the same Blog ownership, readiness, alt-text, and lifecycle rules.

Phase 10 mounts all public and private namespaces as distinct production volumes, probes each
configured root safely for readiness, and provides checksum-verified archive/isolated restore
tooling. Database and media backups use a coordinated quiet window because they cannot share a
transaction. Malware scanning, off-host provider, approved retention, and automatic orphan
reconciliation remain launch decisions.

Phase 11 adds isolated `storage/public/marketing`; Phase 11.1 completes its reusable management workflow. Verified JPEG/PNG/WebP inputs are auto-oriented and re-encoded—without retained EXIF/GPS or raw bytes—into WebP `original` (3200/q92), `hero` (2400/q90), `large` (1800/q88), `standard` (1200/q84), `card` (800/q82), and `thumbnail` (360/q76) variants, without upscaling. Files use generated UUID storage keys; PostgreSQL stores only metadata, relationships, checksums, lifecycle state, and variant records.

The Public Media Library supports parameterized search, bounded pagination, useful usage/orientation filters, metadata and 0–100 focal-point editing, lifecycle-specific Draft/Published references, usage inspection, archive/restore, and referenced-deletion protection. Reusing an asset creates a new reference rather than copying bytes. Archived assets are excluded from new selection but remain readable by existing Published content. Database-creation failure after file processing triggers best-effort removal of the generated UUID directory; operators should continue periodic orphan reconciliation as a defense-in-depth task.

Homepage direct-library mappings are Hero, ordered Services, Residential/Commercial, and Final CTA. Why CTPS currently has no image slot. Featured Transformation and Selected Work keep their Published Before & After source, while Insights keeps its Published Blog source. The library never enumerates or promotes quote, job, blog-draft, private Before & After, or other private media. See `premium-ui-and-marketing-cms.md`.
