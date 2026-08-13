# Premium UI and marketing CMS

## Phase 12 SEO integration

Existing Marketing and Blog SEO fields remain authoritative; Phase 12 adds no duplicate editor or storage. Public metadata consumes Published values through the centralized canonical/social/robots system. The read-only SEO health workspace deep-links to existing editors and reports deterministic missing, duplicate, thin-content, image/alt, broken-link, and orphan findings. Canonical host and index enablement cannot be changed through CMS.

## Design direction

Phase 11 advances the existing CTPS palette into a restrained architectural language: editorial headings, generous space, photography-led compositions, subtle borders, dark charcoal proof/CTA sections, and limited warm accents. The design system—not an editor—owns layout and presentation. Public and Admin retain light, dark, and system themes, visible focus, semantic landmarks, keyboard operation, responsive reflow from 320px upward, and reduced-motion behavior.

The four local `apps/web/public/images/phase-11` images are neutral generated development placeholders. They do not depict customers, projects, staff, credentials, or service outcomes and require explicit approval or replacement before production.

## Homepage and Hero

The published `HOME` record drives homepage section order and visibility. Its Hero is 78–88vh on typical desktop viewports, supports no more than four managed images, holds messaging steady while images crossfade, and uses the approved Soft, Balanced, or Strong overlay. Rotation is limited to 6, 7, 8, or 10 seconds. Autoplay pauses while the tab is hidden or the Hero is directly hovered and is disabled for `prefers-reduced-motion`. The first image is prioritized; later images use responsive Next.js delivery. Controls are keyboard-accessible and expose the current slide in text.

Admin controls include eyebrow, headline, copy, approved CTA links, image choice/order/removal, visibility, focal-point metadata, overlay, autoplay, interval, section order, and preview. The public fallback keeps the approved hardcoded experience available until CMS records exist.

## Controlled CMS architecture

Marketing pages use fixed system keys and routes for Home, Services, About, Contact, Residential, Commercial, the service-area index, five service pages, and six approved British Columbia area pages. Content is strict JSON composed from approved section types. Validation rejects unknown fields, arbitrary HTML, scripts, JavaScript URLs, iframes, CSS, external media URLs, duplicate section identifiers, more than one Hero, and invalid links.

Each page has a versioned Draft and an independent Published snapshot. Draft saves require the current version, create an immutable revision, and never change the public snapshot. Publishing copies the validated Draft to Published and records the publishing revision. Restore creates a new Draft revision rather than changing history. Authenticated preview reads Draft content, is dynamic/no-store through the Admin boundary, and carries `noindex, nofollow`. Public APIs return Published data only.

Sections include Hero, trust strip, service showcase, featured project, residential/commercial, value proposition, process, project grid, service areas, blog preview, FAQ, contact, final CTA, rich text, media/text, and related services. Initial HOME content preserves approved language and the required sequence. The initializer creates only missing fixed records and never overwrites an Admin edit.

## Public Media Library

The public marketing library is physically and logically separate at `storage/public/marketing`. It accepts matching JPEG, PNG, and WebP filename/MIME/signature combinations only, decodes with bounded pixels, auto-orients, strips EXIF/GPS/device metadata by WebP re-encoding, avoids upscaling, and never retains the raw upload. SVG, GIF, PDF, HTML/XML, mismatched, corrupt, empty, undersized, oversized, and excessive-dimension files are rejected. Generated variants are `original` (maximum 3200px, quality 92), `hero` (2400px, 90), `large` (1800px, 88), `standard` (1200px, 84), `card` (800px, 82), and `thumbnail` (360px, 76). These are dimension-and-quality policies rather than guaranteed byte targets.

Metadata includes title, author-managed alt text, caption, X/Y focal point, checksum, dimensions, uploader, and lifecycle state. Usage joins link public media to page sections and social images. Referenced media cannot be deleted. Files are addressed only by generated UUID keys under the managed root. Quote, job, blog-draft, and before/after storage are never searched, imported, or exposed by this library.

Phase 11.1 adds a paginated, searchable Public Media workspace and a reusable page-editor picker. Search is limited to title, safe original filename, and default alt text; filters cover recent, used, unused, landscape, portrait, and square assets. Upload queues show real Ready, Uploading/Processing, Complete, and Failed states, preserve successful files in a partially failed batch, support retry/removal, and clean browser object URLs. The visual focal-point control stores normalized 0–100 X/Y percentages and has keyboard-operable range alternatives. Archived assets disappear from normal picker results, remain deliverable to existing Published content, and may be restored; new Draft selection accepts Ready assets only.

Homepage media fields reuse this picker for up to four Hero images, the ordered service mosaic, Residential and Commercial images, and the Final CTA background. The current Why CTPS composition has no photographic slot. Featured Transformation and Selected Work continue to reference Published Before & After records; Insights continues to reference Published Blog records. Draft and Published media references are lifecycle-specific, so a Draft change or revision restore never detaches a live page image. Media reuse creates another relationship, not another physical file. Per-reference alt overrides remain a future schema enhancement; the current system uses the media-level default.

Homepage photography readiness is an explicit production gate. Editorial layouts use CMS-selected public marketing media when configured. Bundled architectural development photography is only a neutral fallback and must be approved or replaced with real CTPS photography before production publication. Optional project and insight sections are omitted publicly when no valid Published records exist.

## Navigation, settings, SEO, permissions, and audit

Navigation destinations and system keys remain fixed; authorised staff can change labels, order, and visibility with version checks. Site settings contain approved tagline, CTA label, footer copy, and optional configured contact fields. SEO permission separately controls title, description, Open Graph fields, and a public social image. Public pages remain server-renderable with bounded revalidation.

Permissions are `pages.read/update/publish/preview/manageSeo`, `navigation.read/update`, `siteSettings.read/update`, and `mediaLibrary.read/upload/update/archive/restore/delete`. Super Admin receives the full catalogue; ADMIN receives no automatic expansion; AUTHOR retains blog permissions and no marketing-page or public-library access by default. Nest guards enforce each endpoint.

Audits record draft save, publish, restore, marketing-media selection changes, media upload/metadata/focal-point/archive/restore/delete, navigation update, and site-settings update with safe identifiers, counts, field names, and versions. They exclude page bodies, JSON blobs, paths, credentials, customer information, EXIF, and bytes.

## Phase 11.2 remaining public pages

The Homepage remains the benchmark and is not redesigned. Services uses an alternating editorial catalogue. Individual services use page-key-varied Hero, positioning, media/text, scope, property contexts, Published proof, process, areas, FAQ, related services, and CTA. About uses philosophy and numbered principles. Residential is warmer and image-led; Commercial is more structured without invented contracts, clients, response times, credentials, or insurance claims.

Service Areas presents exactly Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver without manufactured local claims. Contact separates general inquiries from the private quote workflow. Before & After remains a Published-only canonical project portfolio. Blog becomes an editorial journal while Blog Admin remains unchanged. Optional proof renders nothing without a valid Published selection.

General photography reuses `MarketingImageField`, the Media Picker, focal metadata, optimized variants, lifecycle references, and deletion protection. Strict fields reject arbitrary HTML, external images, CSS, scripts, embeds, and layout code. Initialisation upgrades only untouched version-1 placeholders. Missing production photography uses neutral treatment or hidden optional sections.

## Performance, initialization, and limitations

Lists and revision reads are bounded; the Media Library uses server-side pagination (24 by default, 48 maximum), thumbnails in grids, and a bounded candidate window for orientation filters. Media variants are immutable-cacheable; public CMS fetches use short tagged revalidation; carousel state is minimal. Publication revalidation is time bounded rather than event pushed. The structured editor intentionally exposes a conservative subset of fields and cannot change routes or add page types.

Run `pnpm auth:initialize` after deployment, then `pnpm marketing:initialize` after the initial Super Admin exists. The additive migration does not insert fake content. Production uses the existing public-media Docker volume and readiness probes the marketing root. Back up the entire `storage/public` tree with the database during a coordinated quiet window.

## Phase 11.3 premium Blog editor

The existing Blog domain remains authoritative; Phase 11.3 replaces only the former block-form writing surface. A self-hosted Tiptap/ProseMirror client editor converts between editor nodes and CTPS's validated JSONB block contract. Tiptap document JSON and HTML are not stored directly. Legacy Phase 8 blocks still load, render publicly, and normalize to the expanded structured representation when edited. The supported vocabulary is deliberately bounded to rich paragraphs, H2-H4, inline bold/italic/underline/safe links, bullet/numbered lists, blockquotes, managed Blog images, dividers, and the existing controlled callout.

Publishing and formatting use separate sticky rows below the existing Admin header. Shared offsets account for their responsive heights, sticky sidebar, anchor/focus position, dropdowns, and modal layers. The toolbar remains mounted for long documents and uses selection-derived block/mark states. Desktop keeps metadata in a sidebar; tablet/mobile retain the bars and move settings to a modal sheet with contained toolbar scrolling.

Image insertion offers only eligible Blog media or a new Blog upload, with alt text, optional caption, standard/wide/full-reading-width presets, replace/remove, and keyboard-accessible move up/down controls. Featured images use the same Blog-only picker. Public Marketing, Quote, Job, and private Before & After namespaces are not queried or merged. Existing Sharp processing, private Draft delivery, publication transitions, and optimized Admin thumbnails remain unchanged.

Save is explicit: there is no autosave or keystroke audit. Dirty navigation is guarded; word count and deterministic reading time are local writing aids. Existing per-post title/description/slug editing gains a search preview, but Phase 12's global SEO audit and architecture remain deferred. Scheduling sends a browser-local choice as UTC, and immutable revision history can now be restored safely as a new Draft revision with permission checks, media/taxonomy validation, optimistic versioning, slug safety, and audit metadata.
