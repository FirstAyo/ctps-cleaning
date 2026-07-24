# Blog Requirements

## Purpose

This document defines a planned, self-hosted publishing system. Public comments, comment moderation, and discussion threads are explicitly excluded.

## Content model and lifecycle

Plan for authors/profiles, posts, categories, tags, featured media, revisions, redirects, and publication metadata. Post states include draft, scheduled, published, and archived, with featured status independent of publication. Preserve revision and publishing history. Slugs and canonical URLs require uniqueness and redirect handling when changed.

Authors can create, edit, preview, publish, and archive their own posts; manage their own post SEO, featured images, and appropriate media; and view publishing history. Every operation uses server-side permission and ownership checks. Broader editorial capabilities require explicit permissions.

## Authoring

The editor should support title, slug, excerpt, sanitized rich content, featured image/alt text, taxonomy, author, SEO title/description, canonical/index controls, Open Graph settings, preview, save state, scheduling, unsaved-change warnings, and revision history. Tiptap or another self-hosted Next.js-compatible editor is a future option, not selected.

Rich content uses an allowlisted schema and is sanitized at a trusted boundary before public rendering. Embedded media must reference authorized records. Preview links are scoped, unguessable, expiring, and non-indexable.

## Public experience and discovery

Plan an index with featured article, article grid, category filtering and search; author/category/tag pages; readable article layout; reading time; table of contents; related posts; author card; service CTA; responsive reading; RSS; XML sitemap; canonical links; social images; and Article/Author structured data from verified fields.

Scheduled publishing uses a VPS-compatible mechanism and must be idempotent, observable, timezone-explicit, and safe after downtime. Search may begin with PostgreSQL capabilities; exact approach remains unresolved.

## SEO and integrity

Support title, description, canonical, index/no-index, publication/modification times, Open Graph, redirects, and structured data. Do not create thin taxonomy pages, duplicate canonicals, fake authors, fake expertise, fake articles, or invented business claims.

## Unresolved decisions

Editor and content format, sanitization library, scheduling worker/cron approach, revision retention, search implementation, preview lifetime, related-post ranking, social-image generation, and editorial approval rules require later decisions.
