# QA Matrix

## Phase 12 SEO and search readiness

| Area                | Automated acceptance                                                                               | Manual acceptance                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Canonicals/metadata | normalized origin/path, title branding, descriptions, OG/Twitter, query/token/preview policy       | representative returned source at production-like origin |
| Structured data     | Organization, WebSite, Service, BlogPosting, BreadcrumbList, optional omission, injection escaping | official live validator after deployment                 |
| Sitemap/robots      | Published-only dynamics, meaningful lastmod, taxonomy exclusions, explicit index switch            | canonical live URLs and staging noindex                  |
| Local SEO           | exactly five services/six BC areas, unique identity, no combination routes                         | content usefulness and natural links                     |
| Admin audit         | counts, filters, severities, metadata/image/link/orphan checks, permission metadata                | 390/768/1024/1440/1920, light/dark, keyboard, console    |

Regression coverage retains CMS isolation, Blog lifecycle/redirect/feed, project visibility, quote/estimate tokens, auth, private media, production environment checks, and deployment verification.

## Phase 11.2 remaining public pages

| Area                    | Automated acceptance                                                                              | Manual acceptance                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Services/details        | Fixed identities, strict CMS, catalogue, inclusions, FAQ, links, Published proof, Draft exclusion | 390/768/1440 crop, rhythm, distinct identities     |
| About/Contact/audiences | No fabricated facts, Contact/Quote distinction, media, process/FAQ/CTA                            | Photography, form clarity, warm vs structured tone |
| Areas                   | Exactly six BC areas, invalid 404, safe copy, projects, FAQ/CTA                                   | Directory and six non-thin pages                   |
| Portfolio               | Published-only mosaic/detail/comparison, no private metadata                                      | Pointer, touch, keyboard comparison                |
| Blog                    | Published-only lead/list, semantic blocks, captions, taxonomy, related posts                      | Hierarchy, reading width, empty results            |
| Media/security          | Existing picker/upload/focal/references/delete protection, managed URLs, permissions              | Guidance, preview, usage, archived behavior        |

Visual review covers 320, 375, 390, 768, 1024, 1440, and 1920 widths, light/dark/system, reduced motion, overflow, focus, console/hydration errors, and production photography readiness.

Run every applicable row on desktop and 320px-equivalent mobile, light/dark, keyboard-only, 200% zoom/reflow, reduced motion, and current Chrome/Edge/Firefox/Safari-WebKit. “Manual” requires recorded evidence; automated coverage supplements rather than replaces it.

| Feature / role                 | Routes and expected result                    | Security/error focus                                                 | Coverage                              |
| ------------------------------ | --------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| Marketing / visitor            | `/`, services, areas, about/contact/FAQ/legal | No invented content; usable unavailable states                       | Automated render + manual visual/a11y |
| Authentication / staff         | Admin login, change password, sessions        | Generic login error, CSRF, Secure cookie, expiry/revocation          | Automated + manual browser            |
| Users/roles / Super Admin      | Admin management routes                       | Final Super Admin invariant; permission confirmation/audit           | Automated + manual                    |
| Portfolio / staff+visitor      | Admin editor and public Published pages       | Draft/private denied; publication controls; media variants           | Automated/runtime/manual comparison   |
| Quote / visitor+staff          | Quote form/confirmation/Admin detail          | Origin/rate/idempotency; private photos; receipt not booking         | Automated/runtime/manual              |
| Estimator / visitor+staff      | Estimate/result/pricing Admin                 | No trace/public rules; preliminary only; invalid config fails closed | Automated/runtime/manual              |
| Blog / Author+visitor          | Editor/preview/public archives/feed           | Own/all enforcement; Draft/Scheduled private                         | Automated/runtime/manual              |
| Jobs / authorised staff+Author | Jobs list/calendar/detail/actions             | Author denied; private notes/media; legal transitions/conflicts      | Automated/runtime/manual              |
| Email / operator               | Outbox CLI and Admin state                    | No private links/body logs; bounded retry/deduplication              | Automated/runtime                     |
| Schedulers / operator          | Publish, reminders, outbox, cleanup dry-run   | Locking, idempotency, bounded output, safe retry                     | Runtime/manual operations             |
| Backup/restore / operator      | Shell tooling and isolated rehearsal          | Confirmation, checksum, no production default                        | Argument test + isolated manual       |
| Infrastructure / operator      | Compose/Nginx/health/restart                  | No public DB/API, volume persistence, TLS/headers                    | Static/runtime/manual                 |

Representative end-to-end release test: visitor browses services, calculates a preliminary estimate, transfers allowlisted answers into a quote, uploads neutral private photos, submits once, staff reviews and accepts, converts once to a job, schedules/assigns/checks/completes with private media, Author publishes owned content but is denied customer/jobs, Admin publishes a consent-approved portfolio record, and signed-out public checks see only Published content. No payment or customer account participates. Remove disposable records/media/outbox/audit fixtures afterward.

Performance review records Lighthouse/Web Vitals and server timings for home, services, blog, quote, estimate, Admin list, and representative images. Current architecture uses Server Components by default, local fonts/assets, standalone builds, responsive managed variants, bounded queries, and static-asset caching. Establish real budgets from a production-like host; do not claim capacity without load testing.

Phase 11 adds checks for Published-versus-Draft isolation, preview auth/noindex/no-store, concurrency, revision restore, Hero maximum/interval/overlay/reduced motion/tab pause, safe CTA links, section order/visibility, SEO permission, exact BFF paths, public-media signatures/variants/focal points/reference deletion, and denial of private-media crossover. Visual QA covers listed public and Admin surfaces at 320, 375, 390, 768, 1024, 1440, and 1920 pixels in light/dark/system and reduced-motion modes.

Phase 11.1 focused automation covers valid JPEG/PNG/WebP, large resize, orientation, metadata stripping, SVG/HTML/double-extension/empty/MIME-signature rejection, per-file and batch limits, excessive dimensions, partial multi-upload, database-failure cleanup, traversal filenames, all six variants, no upscale, search, pagination, filters, archive/restore, usage, referenced-delete conflict, picker selection, upload retry state, Hero maximum/reorder/remove, focal ranges, and default alt text. Regression coverage must keep Draft/Published and revision media references separate and must verify that quote, job, unpublished Blog, and private Before & After media never enter Public Media responses.

Manual acceptance uses 320, 375, 390, 768, 1024, 1440, and 1920 widths. Verify native dialog focus containment/Escape/restoration, keyboard search and selection, screen-reader labels/status, touch targets, no horizontal overflow, loading/empty/error states, light/dark/system themes, and no console/hydration errors. Runtime compression evidence records input dimensions/bytes and each generated variant's dimensions/bytes, verifies absent EXIF/GPS, reuses one asset in multiple Homepage slots, confirms Draft does not affect Published until Publish, exercises usage/delete protection and archive/restore, checks Author denial, then removes disposable media.

## Phase 11.3 Blog editor

| Area                            | Automated acceptance                                                                                                                                               | Manual acceptance                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Editor shell/sticky rows        | Separate publishing and formatting rows, toolbar outside article content, responsive settings sheet, long-document toolbar remains mounted                         | Scroll a 2,500-3,000-word article at 390/768/1024/1440/1920; verify offsets, no overlap/jump/overflow, and formatting at bottom   |
| Formatting/compatibility        | Paragraph, H2-H4, bold/italic/underline, lists, quote, links, divider, managed image, callout, undo/redo controls; legacy conversion and public semantic rendering | Selection preservation, active states, keyboard shortcuts/navigation, image move/replace/remove, preview/public comparison        |
| Save/lifecycle                  | Dirty/saving/saved/error/conflict behavior, navigation warning, word/read time, existing publish/schedule/redirect tests, revision restore creates a new revision  | Save/reload, preview, publish/update, UTC scheduling, restore, actionable failure messages                                        |
| Media/security                  | Eligible Blog-only media, upload/insert metadata, private Draft lifecycle, unsafe markup/protocol rejection, unsupported JSON rejection                            | Alt/caption guidance, optimized thumbnails, private delivery, no Public/Quote/Job/Before & After crossover                        |
| Permissions/accessibility/theme | Existing own/all and publish guards, accessible names/pressed states/statuses                                                                                      | Author/Admin/Super Admin matrix, dialog focus/restoration, touch targets, 200% reflow, reduced motion, light/dark/system, console |

Manual long-article evidence must cover beginning, 25%, 50%, 75%, and bottom; bold, italic, heading, list, link, undo, and redo near the bottom; retained selection and scroll position; save/reload/preview/public rendering; word count and reading time; and cleanup of disposable posts/media. Automated structure checks do not replace this browser evidence. Phase 12 SEO tests remain out of scope except regression coverage for the existing per-post fields and search preview.
