# Public Website UI Specification

Phase 9 adds no public job routes, availability, appointment confirmation, customer login, rescheduling, cancellation, payment, or tracking. Existing quote messaging may continue to explain that CTPS contacts customers after review.

## Purpose

This specification defines the public screen structure, responsive behavior, states, and interactions. Phase 4 implements its marketing scope as recorded in `public-marketing-implementation.md`; Phase 5 implements the database-backed before-and-after experience recorded in `before-after-implementation.md`. Other business workflows remain planned.

## 1. Global public layout

- An optional announcement/service-area bar precedes a sticky header and contains one concise, verified message; it must not become a rotating distraction.
- The header contains brand, desktop navigation, Services menu, theme control, and primary quote CTA. Main content uses semantic landmarks, a consistent fluid/max-width container, and full-bleed sections only deliberately.
- Provide a first-focus “Skip to main content” link and one clear `main` target. Footer groups service, area, company, resource, contact, social, legal, and theme links without inventing details.
- The header may remain sticky. At scroll it can reduce padding and gain an opaque surface/border/shadow, without shrinking targets or causing layout shift. It must remain legible over every section.
- Visible high-contrast focus rings are never removed. Focus order follows the visual order.
- Desktop applies at a content-driven breakpoint where navigation fits. Below it, replace—not squeeze—the nav with a menu trigger and drawer.

## 2. Header behavior

The primary bar supports the CTPS logo; Services; Before and After; Service Areas; Price Estimator; Blog; About; Contact; Request a Quote; theme toggle; and mobile trigger. To avoid crowding, Services and possibly company links use clearly labeled menus; priority items and quote CTA remain visible at wide widths.

Services opens on click/keyboard, not hover alone. The trigger exposes expanded state and menu relationship; Arrow keys/Escape and focus return work predictably. Pointer hover may supplement this behavior. The mobile drawer traps focus, closes with Escape/backdrop/close button, restores trigger focus, prevents background interaction, and uses expandable subnavigation. Theme controls have an accessible name and indicate the selected theme.

## 3. Homepage information architecture

1. **Announcement/service-area bar:** quickly confirms the supported region or important operational notice.
2. **Header:** provides orientation, key routes, theme, and primary quote action.
3. **Premium hero:** explains CTPS value, separates quote and estimate actions, and provides immediate visual confidence.
4. **Trust strip:** shows only verified credentials, service characteristics, or approved review evidence—never fabricated statistics.
5. **Services overview:** lets visitors compare the five configurable service families with deliberate hierarchy.
6. **Before-and-after feature:** demonstrates outcomes through approved project imagery and accessible comparison.
7. **Why choose CTPS:** explains substantiated differentiators, process quality, and customer care.
8. **How the process works:** sets expectations from inquiry to staff contact and explicitly avoids implying instant booking.
9. **Featured projects:** offers browsable proof tied to services and locations.
10. **Estimator CTA:** explains preliminary ranges, eligibility, and non-binding status.
11. **Testimonials:** displays only verified, approved testimonials with source/context where authorized; hide section if none exist.
12. **Residential/commercial:** routes distinct customer needs without suggesting identical workflows.
13. **Service areas:** lists active locations and makes availability easy to check.
14. **Featured blog posts:** surfaces useful current guidance from published content.
15. **Final quote CTA:** provides a calm next step after visitors have gathered context.
16. **Footer:** supplies secondary navigation, verified business details, policies, and accessibility/theme affordances.

## 4. Hero design

Use an asymmetrical desktop grid: concise text (roughly 10–14 words for the headline and a readable 45–65 character paragraph measure) beside one strong property-cleaning image. Include primary Request a Quote and secondary Get an Estimate buttons, one verified trust indicator, and optional review/credibility card and service-area badge only when sourced.

Use a stable image box around 4:3 or 5:4 on desktop and a wider crop on compact screens, with art direction preserving the subject. Do not place long copy over busy imagery. Mobile stacks text/actions before image; buttons may become full-width on narrow screens. Reserve dimensions, prioritize the main image responsibly, use a meaningful alt or empty alt if decorative, and show a neutral placeholder rather than content jump. Motion is limited to a short optional reveal and removed under reduced motion.

## 5. Services section

Use an editorial grid rather than five equal generic cards: one featured service spans greater area, two medium entries establish the next tier, and smaller entries complete the set. Selection of “featured” comes from approved configuration, not a hardcoded assumption. Cards include optimized image, title, short description, text link, and an icon only if useful.

On wide screens use an asymmetric 12-column composition; on tablets simplify to a two-column grid with featured item spanning; on mobile use one column in meaningful display order. Hover may adjust border/image scale subtly; keyboard focus receives equivalent emphasis without layout change. The whole card may be one link, but never nest interactive controls.

## 6. Before-and-after UI

The primary component layers matched, equally cropped images with persistent Before/After labels and a draggable divider. Support pointer drag, touch, and a keyboard-focusable handle: Arrow keys adjust in small increments, modified/Page keys may adjust faster, Home/End reach bounds. Expose the comparison value and instructions accessibly.

Adjacent content gives project title, location, service type, summary, thumbnails, and category tabs. Tabs follow accessible tab semantics and filters update an announced result count. On mobile, comparison precedes metadata and uses a touch-safe handle without blocking page scroll unnecessarily.

Provide a non-slider fallback that presents two complete labeled images side by side or stacked. Reduced motion disables demonstration/animated settling. Loading uses a fixed-ratio skeleton; one missing image switches to a labeled single-image/fallback state; both missing show an honest unavailable state, never a broken control.

Phase 5 renders only Published database records, uses an honest empty state when none exist, supports service/service-area filters with an announced result count, and provides detail pages with lazy supporting galleries. Draft/Archived records and private storage metadata never enter public responses. The homepage uses one featured Published project or the honest managed empty state.

## 7. Quote-request UI

A multi-step option is recommended for Service, Property, Contact, Photos/Timing, and Review. A text progress indicator names the current step and total; steps are not falsely marked complete. Service selection supports one or more active quote-enabled services. Conditional questions are schema-driven and preserve compatible answers when navigating back.

Use visible labels, address/service-area validation, appropriate autocomplete/input modes, and mobile-friendly date/email/phone keyboards. Photo upload communicates allowed types/count/size, per-file progress/error/removal, privacy, and optional status. Preferred dates are preferences, not appointments.

Review summarizes editable sections, consent/privacy acknowledgement, and receipt expectations. On validation failure, show a linked error summary plus inline messages; focus the summary and preserve values. Network/server errors offer safe retry without duplicate creation. Success shows a reference number, confirmation-email expectation, and that CTPS will review/contact—not a booking.

Guest save-progress is limited to the active session unless a later secure mechanism is approved; warn before promising persistence. Do not store sensitive contact/property data in durable browser storage by default.

## 8. Estimator UI

The landing page explains supported services, required information, preliminary nature, and approximate completion effort without invented timings. Flow includes multi-service selection, conditional questions, property type, service area, and clear progress. Unsupported service/area combinations are disabled or explained before submission.

While calculating, keep answers visible and announce progress; prevent duplicate submissions. The result card emphasizes a formatted min–max range, an approved high-level breakdown, and the exact non-binding meaning from `estimator-requirements.md`. Primary Convert to Quote retains answers; Edit Answers returns without loss; Start Over requires confirmation if substantial input would be cleared.

Invalid configuration shows no price, a neutral apology, quote-request route, and internal correlation reference—not technical details. Service unavailable explains that estimation is unavailable while allowing a quote if configured. Mobile keeps result and actions in reading order, avoids a permanently obstructive sticky panel, and formats currency without horizontal overflow.

## 9. Service pages

Use a repeatable but content-responsive structure: focused hero; service summary; benefits; what is included; separate residential/commercial use cases; process; approved before/after examples; accessible FAQs; service-area availability; estimator or quote CTA based on configuration; and related published articles. Availability, claims, FAQs, images, and CTAs are data-driven. Structured data must match visible verified content.

## 10. Service-area pages

Each page includes a genuine location introduction, available service list, approved local projects/proof, relevant FAQs, optional accessible map/geographic visual, unique local SEO copy, quote CTA, and related service links. Never generate duplicate thin pages. If a map is interactive, provide a text equivalent and avoid blocking content; do not imply exact boundaries without validated data.

## 11. Blog public UI

The index provides a featured published article, responsive article grid, category filters, and search with query/status/empty states. Author/category/tag pages identify their scope and avoid thin indexing. Cards show approved image, title, excerpt, author/date where configured, and reading time generated consistently.

Phase 8 implements the database-backed Published-only index, search/filter/pagination, article details, related cards, meaningful category/tag/author archives, managed responsive images, captions, canonical/social metadata, BlogPosting and breadcrumb data, dynamic sitemap entries, and `/blog/feed.xml`. Empty results remain honest; Draft/Scheduled/Archived content and private previews never appear publicly.

Article pages use a readable centered measure with optional wide media, breadcrumb, title/deck, publication metadata, reading progress, keyboard-navigable table of contents, sanitized content, author card, related articles, and contextual service CTA. Reading progress is nonessential and hidden/reduced when appropriate. Mobile prioritizes text, makes the TOC collapsible, prevents code/media overflow, and preserves zoom.

## 12. Forms

Visible labels sit above or beside controls; placeholders are examples, never labels. Helper text precedes errors in the accessible description. Required status is consistent and explained once. Use tokenized target/input heights, expanding textareas, native semantics where possible, and fieldsets/legends for checkbox and radio-card groups.

File upload supports button and drag/drop without requiring drag. Errors explain correction, not just failure; a top summary links to invalid fields. Disabled controls remain legible and explain why where necessary. Loading buttons retain width and announce state; success is both visible and announced. Never clear the form after a recoverable server error.

## 13. Public states

The Phase 7 `/estimate` implementation uses six keyboard-operable steps and one service per estimate. It exposes only published availability/questions, approved explanation labels, non-binding range/manual-review text, assumptions, exclusions, and expiry. Tokenized result routes are noindex and excluded from robots; unavailable and expired states offer the quote-request path without a fallback price.

- **Loading:** reserve layout; use skeletons only where shape is known and label indefinite operations for assistive technology.
- **Empty:** explain why no content matches and offer a safe next step/reset.
- **Error/offline:** use plain language, preserve input, offer retry, and provide a correlation reference when helpful.
- **Success:** state exactly what occurred and the next action; receipt is not booking.
- **Not found:** retain global navigation, explain the missing page, and link to services/search/home.
- **Maintenance:** state temporary unavailability without fake restoration times and preserve emergency/verified contact routes if available.

## 14. Public animation strategy

Permitted motion includes restrained section/card/image reveals, hover transitions, mobile-menu and tab transitions, a one-time comparison demonstration, reading progress, and small counters only for verified values. Motion must support usability, never delay interaction, and avoid heavy parallax or persistent autoplay. Prefer CSS for simple transitions; use Motion for React only for justified coordinated state. Under reduced motion, remove transforms/staggers/autoplay and keep immediate state changes and functional feedback.

## Content and acceptance constraints

No fake testimonials, reviews, statistics, project claims, prices, contact details, or service availability. Test keyboard-only navigation, screen-reader names/status, 200% zoom and reflow, touch controls, theme contrast, reduced motion, slow/error/offline paths, responsive imagery, and guest form recovery before release.
