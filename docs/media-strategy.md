# Media Strategy

## Purpose

This document defines a provider-neutral plan for service, blog, author, project, Open Graph, and customer-upload media. Phase 4 uses only original committed development illustrations for static public presentation; no storage service or upload workflow is implemented.

## Phase 4 local assets

Public marketing illustrations are organized under `apps/web/public/images` and referenced through local root-relative paths with Next.js image handling. They contain no customer data, third-party watermarks, or external URLs and are labeled as development demonstrations where project meaning could otherwise be inferred. Approved CTPS photography may replace these stable references later. The quote-photo presentation is static and implements no file picker, object URL, upload, persistence, or API call.

## Classification boundary

- **Public media:** approved marketing/content assets intended for public delivery.
- **Private media:** customer quote-request uploads and any restricted staff assets. These are private by default and never placed beneath a publicly served path.

Metadata should record owner/uploader, classification, purpose, original name (safely handled), detected MIME type, byte size, dimensions, checksum, storage key/provider, alt text/caption where relevant, variants, references, timestamps, and lifecycle status. Do not expose internal storage keys as authorization.

## Upload pipeline

Authorize purpose and owner, limit count/size, inspect content rather than trusting extensions or headers, decode images safely, validate dimensions, generate randomized keys, strip risky metadata where appropriate, and isolate processing. Reject unsupported/polyglot/malformed files. Malware scanning requirements and exact limits remain unresolved.

Generate responsive sizes and WebP/AVIF where practical while retaining an appropriate source. Prevent decompression bombs and unbounded processing. Public output needs width/height, suitable loading priority, and alt-text workflows; before/after pairs require separate accurate alt text.

## Access and deletion

Public assets may be cached at stable URLs after publication. Private bytes require authenticated, authorized streaming or short-lived signed access and non-public caching rules. Admin previews must use the same authorization boundary.

Track usage before deletion. Referenced assets should be blocked from deletion or require a deliberate replacement workflow. Private deletion follows approved retention/legal requirements and audit policy; backups mean deletion may not be instantaneous.

## Storage evolution

Initial VPS storage may use separate persistent public/private volumes if reliability, backup, and deployment needs are met. Keep a storage adapter so metadata and application URLs do not depend on disk paths. Migration to Cloudflare R2, Backblaze B2, MinIO, or another S3-compatible provider should copy by checksum, verify, switch reads gradually, retain rollback, then retire old bytes after reconciliation. Object storage is not required in Phase 1 without justification.

## Operations

Back up media off-host, test restores, monitor capacity and failed processing, and reconcile orphaned records/objects. CDN choice, quotas, retention, acceptable MIME types, transformations, virus scanner, storage provider, and migration threshold remain unresolved.
