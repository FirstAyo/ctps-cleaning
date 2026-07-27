# QA Matrix

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
