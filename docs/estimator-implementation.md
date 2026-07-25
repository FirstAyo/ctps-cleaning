# Phase 7 preliminary estimator implementation

## Public workflow and result contract

`/estimate` is a six-step, one-service workflow: service, customer type, approved British Columbia area, service-specific answers, review, and calculation. The API is authoritative. It either returns a CAD range or `MANUAL_REVIEW`; neither outcome is a quote, offer, booking, guarantee, tax calculation, or final price. Result pages expose approved driver labels, assumptions, exclusions, version code, disclaimer, and expiry—not rule values or the internal trace. When no single effective Published version exists, the UI fails closed and links to the quote request.

Money is stored and calculated as integer cents. Percentage rules store integer basis points (100 = 1%) and use integer-safe floor/ceiling division. After ordered adjustments, the minimum charge and maximum cap are enforced and the range is rounded outward to the configured increment, so rounding never narrows it.

## Hybrid pricing architecture

PostgreSQL owns versioned business values in `PricingVersion`, `ServicePricingConfiguration`, and `PricingRule`. Staff can configure base ranges, floor/cap/rounding, availability, safe disclaimers/assumptions/exclusions, effective dates, and typed rules. `packages/pricing` owns the approved service/question catalogue, rule/operator catalogue, validation, stable ordering, integer arithmetic, manual-review behavior, and public/internal breakdown creation. No expression, code, SQL, template, or unrestricted formula is stored or evaluated.

Rules execute in this stable order: manual-review gates; tier/range replacement; per-unit adjustment; fixed additions; customer-type additions; service-area additions; percentage adjustments; minimum-charge enforcement; cap; outward rounding; invariant validation. Supported stored rules are fixed addition/replacement, per-unit, percentage, tier, minimum charge, service-area addition, customer-type addition, and manual review. Conditions are strict comparisons or boolean predicates.

All five services have central typed questions. Unknown answers, unknown questions in rules, out-of-bound numbers, unapproved options, disabled services, invalid range configuration, and unavailable versions fail safely. Pressure-washing uncertainty and selected moss/vent scopes can produce Manual Review without fabricating a range.

## Version lifecycle and initial values

Draft versions are never public. Publishing requires an effective date, all five service configurations, valid rules and text, and a non-overlapping Published effective period. Published and Archived records are immutable through edit endpoints; changes start from a new or cloned Draft. Estimate rows retain a restrictive foreign key and complete snapshots, so later pricing changes cannot rewrite history. Only unreferenced Draft versions can be hard-deleted.

`pnpm estimator:initialize-development` creates the idempotent `DEV-INITIAL-REQUIRES-APPROVAL` Draft for an existing active Super Admin. Its values are development starting points, not approved CTPS prices, and the command never publishes it. CTPS must review, preview, approve, set an effective date, and explicitly publish before the public estimator becomes available.

## Persistence, abuse controls, and quote transfer

Each calculation stores normalized inputs, an input fingerprint, outcome/range, CAD, pricing-version identity, public explanation, assumptions/exclusions/disclaimer snapshots, internal trace, expiry, and conversion state. Default result retention is seven days. A client UUID is stored only as a SHA-256 idempotency hash; replay returns the original stored result. Durable database throttling and same-origin checks protect calculation and transfer mutations.

Public result and transfer credentials are independent 256-bit random base64url values. Only SHA-256 hashes are stored. Tokens are unguessable, omitted from logs/audit metadata, and results are `noindex` and excluded by robots. The result page creates a short-lived transfer token. Its allowlisted service, customer type, area, and compatible answers can prefill `/request-a-quote`; the quote API re-loads the server record and never trusts client-supplied range/version/ID values. A changed or expired estimate does not block quote submission: it is linked with `INPUTS_CHANGED` or `EXPIRED`; an unchanged one is `MATCHED`. The estimate snapshot remains informational and non-binding.

## Protected administration and audit

Protected routes are `/pricing/versions`, `/pricing/versions/new`, `/pricing/versions/[id]`, `/estimator-results`, and `/estimator-results/[id]`. They support list/create/clone, structured service/rule editing, safe lifecycle actions, result filters/detail, permission-gated trace access, and result archival. The API enforces `pricingVersions.*`, `pricingRules.*`, and `estimatorResults.*`; UI visibility is convenience only. `SUPER_ADMIN` receives every known permission after `pnpm auth:initialize`; `ADMIN` and `AUTHOR` receive none of the Phase 7 permissions by default.

Safe audit events cover calculation metadata, version/rule/configuration changes, publish/archive/delete, and result archive. Tokens, hashes, pricing values, calculation traces, source identifiers, and customer data are excluded from audit metadata.

## APIs, environment, accessibility, and operations

Public endpoints are configuration, calculate, tokenized result, quote-transfer creation, and allowlisted transfer retrieval under `/public/estimator`. Protected endpoints are under `/admin/pricing` and `/admin/estimator-results`. Environment settings are `ESTIMATOR_RESULT_TTL_SECONDS`, `ESTIMATOR_TRANSFER_TTL_SECONDS`, `ESTIMATOR_RATE_LIMIT_MAX_ATTEMPTS`, and `ESTIMATOR_RATE_LIMIT_WINDOW_SECONDS`.

The UI uses semantic fieldsets/labels, keyboard-operable controls, visible focus inherited from the design system, live error/status regions, mobile-first layouts, and text in addition to colour. Result pages are dynamic and `noindex`; `/estimate` remains in the sitemap. Local setup is `pnpm db:start`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm auth:initialize`, optional Draft initialization, and the normal quality commands.

Known limitations: CTPS must approve real prices, legal wording, retention, and all rule combinations; the current admin preview surface is intentionally conservative; formal quote preparation, booking, payment, customer accounts, and job/scheduling management remain deferred.
