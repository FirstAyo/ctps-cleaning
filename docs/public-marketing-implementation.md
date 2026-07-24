# Public Marketing Website Implementation

## Scope and status

Phase 4 implements the static, customer-facing CTPS marketing website. It uses the Phase 2 design system and preserves the Phase 3 protected administration system. Public marketing pages are rendered without the API or database. Quote submission, estimator calculations, uploads, project records, blog publishing, customer accounts, email, and scheduling remain deferred.

## Routes

The implementation includes `/`; `/services` and five service routes; `/residential`; `/commercial`; `/before-after`; `/service-areas` and six area routes; `/about`; `/contact`; `/faq`; `/blog`; `/estimate`; and `/request-a-quote`. `/design-system` remains available as the Phase 2 preview and is excluded from production indexing.

## Page and content architecture

The homepage follows the approved sequence: regional announcement, real public header, asymmetrical hero, safe trust strip, editorial service grid, comparison feature, CTPS value section, residential/commercial split, four-step process, demonstration gallery, estimator promotion, service areas, empty verified-testimonial state, planned blog topics, final quote CTA, and public footer.

Typed content in `apps/web/src/content/site.ts` centralizes service definitions, service areas, navigation, FAQs, planned article topics, and CTA inputs. Shared compositions in `apps/web/src/components/marketing.tsx` provide service cards, grids, heroes, comparison, area and service templates, planned editorial cards, photo-workflow preview, and quote CTAs. This avoids database-backed marketing content or a premature CMS abstraction.

## Header and footer

The public header provides brand/home navigation, an accessible click/keyboard Services disclosure, direct public routes, theme control, quote CTA, current-route indication, and a focus-managed mobile dialog. The mobile menu locks body scroll, closes with Escape or backdrop/close controls, and restores trigger focus. A skip link precedes the header.

The footer groups all five services, six service areas, company pages, resources, legal placeholders, the design-system preview, and an explicit contact-information gap. It contains no invented phone, email, address, hours, social profile, or credential.

## Templates and foundations

Each service page contains a hero, accurate overview, conditional inclusions, residential/commercial uses, quote-based process, local comparison demonstration, visible FAQs, related areas, planned editorial topics, and quote CTA. Service-area pages use unique approved wording, service categories, residential/commercial context, workflow, visible FAQs, and related CTAs without neighborhood doorway content or local statistics.

`/before-after` uses the shared accessible range-based comparison with Next.js images, persistent labels, pointer/touch/native range support, keyboard steps, Home/End, written instructions, live output, and reduced-motion handling. All entries are labeled development demonstrations. Phase 5 owns records, uploads, and admin management.

`/blog`, `/estimate`, and `/request-a-quote` are honest foundations. The blog contains only labeled planned topics. The estimator contains no pricing or calculation logic. The quote page uses disabled fields and a static multi-photo presentation; it creates no records, references, uploads, object URLs, emails, or submitted state.

## Local media strategy

All Phase 4 images are original repository SVG illustrations under `apps/web/public/images`, organized by homepage, service, before/after, service-area, and about purpose. Public code uses root-relative `/images/...` paths and Next.js `Image` where images form page content. Descriptive filenames, stable dimensions, and meaningful alt text are present. These development assets must be replaced or explicitly approved before production and are never represented as CTPS customer work.

The photo-preview component anticipates file-count, type, size, removal, ordering, thumbnail, and primary-image concerns in copy and layout only. It has no input of type `file`, upload transport, API integration, persistence, or object URL.

## SEO and structured data

Every public route defines a title, description, canonical URL, Open Graph values, and Twitter card metadata through the shared helper. Safe Organization and WebSite schemas appear on the homepage; Service schema appears on visible service pages; Breadcrumb schema appears on service and area detail pages; FAQ schema appears only with visible FAQ content. No contact, rating, review, price, hours, or legal identifiers are fabricated.

`sitemap.ts` emits all 23 public marketing routes and no article/project routes. `robots.ts` allows public content, links the sitemap, and excludes `/admin` and `/design-system`.

## Accessibility, animation, responsive behavior, and performance

Semantic landmarks, one main target, heading hierarchy, visible labels, disabled-state explanations, meaningful links, alt text, focus rings, native disclosures, touch-sized controls, and comparison instructions support practical WCAG 2.2 AA-oriented behavior. Theme tokens preserve light/dark support. Existing reduced-motion rules compress all motion and disable smooth scrolling. Motion is limited to a short hero reveal and subtle transitions.

Layouts begin in one column, add content-driven grids at wider widths, wrap long headings, preserve image aspect ratios, and avoid fixed widths that create normal horizontal scrolling. Server Components remain the default; client JavaScript is limited to theme, navigation, and comparison interaction. Static pages do not require API or database availability.

## Known gaps and deferred work

- Approved CTPS logo, project photography, business story, contact details, legal/privacy wording, and verified testimonials are unavailable.
- Local development illustrations require approval or replacement before production.
- Manual screen-reader, physical-device, 200% zoom, console, and production-domain SEO validation remain Phase 10 release QA.
- Phases 5–8 own project data/media, quote requests/uploads/email, estimator rules/calculation, and database-backed blog publishing respectively.
- No new dependency was added for Phase 4.
