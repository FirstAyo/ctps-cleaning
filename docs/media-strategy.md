# Media Strategy

## Purpose

This document defines a provider-neutral plan for service, blog, author, project, Open Graph, and customer-upload media. Phase 4 introduced committed development illustrations. Phase 5 adds managed before-and-after storage. Phase 6 adds a separate, private-only customer quote upload workflow; a general media library remains unimplemented.

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

## Operations

Back up media off-host, test restores, monitor capacity and failed processing, and reconcile orphaned records/objects. CDN choice, quotas, retention, acceptable MIME types, transformations, virus scanner, storage provider, and migration threshold remain unresolved.
