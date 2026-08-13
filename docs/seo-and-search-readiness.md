# SEO and search readiness

## Scope and policy

Phase 12 centralizes deterministic SEO infrastructure without rewriting approved public copy. Only real Published public content can be indexable. Draft, preview, staff, API, health, private-media, quote-confirmation, and estimator-result routes remain outside the index and sitemap. Robots directives complement authentication and never replace it.

The canonical public origin is configured by `NEXT_PUBLIC_SITE_URL`, with `WEB_URL` as the server-side fallback. Deployment must set both to the same reviewed public origin. Production uses one HTTPS host; the example host is a placeholder, not an asserted CTPS domain. Nginx already redirects HTTP to HTTPS. An alternate deployed host must redirect directly to the configured canonical host while preserving safe paths and queries.

`PUBLIC_INDEXING_ENABLED` is the explicit search switch. It defaults safely to `false`; development and staging disallow crawling and emit page-level noindex. Set it to `true` only for the approved canonical production host after launch review. A false environment emits no sitemap entries. Canonical paths are lowercase, collapse duplicate slashes, omit trailing slashes except `/`, and exclude queries/fragments.

## Indexability matrix

| Route family                                                                       | Index/follow                       | Canonical              | Sitemap | Access             | Structured data                |
| ---------------------------------------------------------------------------------- | ---------------------------------- | ---------------------- | ------- | ------------------ | ------------------------------ |
| `/`                                                                                | index/follow in enabled production | self                   | yes     | public             | Organization, WebSite          |
| `/services`, `/residential`, `/commercial`, `/about`, `/contact`, `/service-areas` | index/follow                       | self                   | yes     | public             | page-specific where applicable |
| five `/services/{slug}` routes                                                     | index/follow                       | current system slug    | yes     | public             | Service, BreadcrumbList        |
| six `/service-areas/{slug}` routes                                                 | index/follow                       | current system slug    | yes     | public             | BreadcrumbList                 |
| `/before-after`                                                                    | index/follow                       | self                   | yes     | public             | none required                  |
| Published `/before-after/{slug}`                                                   | index/follow                       | current Published slug | yes     | public             | BreadcrumbList                 |
| `/blog` without parameters                                                         | index/follow                       | self                   | yes     | public             | none required                  |
| `/blog` search/filter/pagination queries                                           | noindex/follow                     | none                   | no      | public             | none                           |
| Published `/blog/{slug}`                                                           | index/follow                       | current Published slug | yes     | public             | BlogPosting, BreadcrumbList    |
| non-empty `/blog/category/{slug}`                                                  | index/follow                       | current category slug  | yes     | public             | optional BreadcrumbList        |
| `/blog/tag/{slug}` and `/blog/author/{slug}`                                       | noindex/follow                     | none                   | no      | public             | none                           |
| `/request-a-quote`, `/estimate`                                                    | index/follow                       | self                   | yes     | public             | none                           |
| quote confirmation and estimate result/token routes                                | noindex/nofollow/noarchive         | none                   | no      | token              | none                           |
| Blog/marketing previews                                                            | noindex/nofollow, no-store         | none                   | no      | authorized staff   | none                           |
| Admin/login/design-system                                                          | noindex/nofollow/noarchive         | none                   | no      | staff/development  | none                           |
| APIs, health, private/protected media                                              | non-indexable                      | none                   | no      | internal/protected | none                           |
| Privacy, Terms, Accessibility foundations                                          | index/follow only when enabled     | self                   | yes     | public             | none                           |

Unknown public routes return an actual 404 and noindex metadata. Archived/unpublished Blog posts and projects return 404; no homepage redirect or 410 workflow is currently justified.

## Metadata, social images, and HTML

`@ctps/seo` owns framework-neutral origins, canonicals, route policy, structured-data builders, safe serialization, exact service/area identifiers, link extraction, and audit normalization. The public Next.js adapter builds title, description, canonical, Open Graph, Twitter, and robots metadata. CTPS branding is appended exactly once.

Marketing uses explicit CMS metadata when present and controlled page fallbacks. Its social-image order is the explicit page image followed by existing public page presentation. Blog uses the featured Published Blog image. Projects use the Published primary After image. No Draft/private asset is eligible. Managed image dimensions, responsive variants, focal points, alt text, below-fold loading, and one initial Hero priority remain unchanged; UUID storage keys do not need keyword names.

Critical headings, article bodies, navigation, breadcrumbs, and links render in server HTML. Query/filter URLs do not become an indexable duplicate set. Blog pagination remains crawlable but filtered/paginated `/blog` URLs are noindex until dedicated stable archive pagination is approved.

## Structured data

Builders support factual Organization, WebSite, Service, BlogPosting, and BreadcrumbList entities. They omit absent optional values and safely escape script-sensitive characters. Organization contains only configured identity/origin plus the six approved British Columbia service areas. No address, hours, social profile, phone, rating, review, price, award, or certification is invented.

FAQ schema remains only on the visible general FAQ page and mirrors its rendered questions and answers. It is not a rich-result promise. Before & After uses conservative breadcrumbs instead of Product/Review markup. There is no SearchAction because there is no site-search product.

## Local SEO and internal links

The only area keys are Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver. Five service pages and six area pages remain separate route families. Phase 12 creates no service-by-area, neighbourhood, or keyword doorway pages. A future combination page requires explicit approval, demonstrable customer value, substantial unique verified content, a durable navigation path, and an editorial owner.

Service and area directories provide crawlable discovery. Detail pages expose visual breadcrumbs synchronized with JSON-LD. Blog and Before & After indexes discover Published details. The audit validates CMS CTA and structured Blog links against known internal destinations without crawling the internet. Sitemap inclusion alone does not prevent an orphan warning.

## Sitemap, robots, redirects, and feeds

`/sitemap.xml` contains fixed canonical public routes plus only Published projects, due Published posts, and non-empty categories. Tags, authors, filters, previews, tokens, Admin, APIs, media, health, design-system, Draft, Scheduled-unpublished, and Archived records are excluded. Dynamic content uses stored `updatedAt`; static entries omit unreliable synthetic dates. Split into a sitemap index when an individual sitemap approaches 45,000 URLs.

`/robots.txt` points to the canonical sitemap. Enabled production allows public crawling while discouraging private spaces; disabled environments disallow all crawling. Page-level noindex remains necessary for token, preview, and Admin HTML.

Published Blog slug changes retain the existing permanent old-slug redirect directly to the current post. General marketing routes are fixed, so a general redirect table/editor is not required. Redirects must remain internal, reject loops/conflicting canonical paths, and never intercept Admin/API routes.

## Admin SEO health

`/seo` is a protected operational workspace backed by `GET /admin/seo/overview`. `seo.view` is separately grantable; Super Admin receives it through the existing full-catalogue invariant, while Admin and Author gain nothing automatically. The API derives audits from bounded Published-content queries and persists no score.

The overview reports Published content, errors, warnings, missing descriptions/images, redirects, and expected sitemap URLs. Filters cover content families, error/warning state, missing title/description/image, and search. Records link to existing editors. Findings include missing overrides, missing/archived images, alt text, metadata length guidance, conservative thin-content warnings, exact duplicates, deterministic broken links, and practical orphans. Severity is conveyed by text and icon, not color alone.

SEO edits continue through existing Marketing, Blog, and Project editors, preserving permissions, versions, previews, publication rules, and audit events. Canonical origin and environment indexing are not CMS-editable. No migration, duplicate SEO storage, AI generation, external SEO SaaS, or runtime internet crawler was added.

## Performance and accessibility

Server Components remain the default and Phase 12 adds no public client JavaScript. Existing image and font strategies are preserved. Breadcrumbs use labeled navigation and ordered lists. The Admin audit uses responsive cards, labeled filters, keyboard-native controls, inherited focus styles, and non-color issue labels.

## Launch checklist

- [ ] Approve the production hostname and matching `WEB_URL`/`NEXT_PUBLIC_SITE_URL`.
- [ ] Confirm Nginx redirects HTTP and alternate hosts directly to canonical HTTPS.
- [ ] Keep `PUBLIC_INDEXING_ENABLED=false` on development and staging.
- [ ] Approve production content, legal foundations, imagery, authors, and contact data.
- [ ] Enable indexing only on the approved production release.
- [ ] Verify live `/robots.txt`, `/sitemap.xml`, source metadata, status codes, redirects, and JSON-LD.
- [ ] Test 404, old Blog slug, preview, estimate result, and quote confirmation behavior.
- [ ] Validate structured data and social previews with official live tools after deployment.
- [ ] Add genuine Google/Bing verification tokens only through later approved configuration.
- [ ] Verify ownership, submit the sitemap, and spot-check indexing after launch. No submission occurred in Phase 12.

## Phase 13 content requirements

Phase 13 must approve unique titles/descriptions, useful area introductions, service differentiation, contextual links, alt text, taxonomy depth, author biographies, legal copy, verified business/contact facts, and production photography. Resolve warnings editorially without keyword stuffing, fabricated local claims, fake reviews/ratings/prices, or automated city pages.
