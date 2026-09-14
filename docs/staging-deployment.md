# Staging deployment

This runbook deploys the `staging` branch to the isolated CTPS staging environment. It does not
authorize production deployment, production DNS changes, or search indexing. Read
`deployment-runbook.md`, `production-readiness.md`, and `phase-13-launch-readiness.md` first.

## Required operator inputs and hard stops

Record the approved VPS hostname/IP, non-root SSH user, recovery path, Cloudflare/registrar access,
authorized staging Super Admin identity, controlled email recipients, and backup destination outside
Git. Stop if the source tree is dirty, the checked-out branch is not `staging`, recovery access is
unverified, or any required value is unknown.

Before changing nameservers, export the complete current authoritative DNS zone into a protected
operator record. Record type, name, value/target, priority, and TTL for MX, SPF, DKIM, DMARC,
provider verification, mail/autodiscover/autoconfig CNAMEs, and relevant SRV/TXT records. Compare
that export record-for-record with the proposed Cloudflare zone. Mail hosts remain DNS-only where
required; do not proxy SMTP, IMAP, or POP. Never create a second SPF policy. Do not proceed until
the mail provider confirms every active DKIM selector and verification record. Use Cloudflare Full
(strict), never Flexible.

If nameservers change, test company-mail inbound, outbound, and replies using authorized mailboxes;
then verify SPF, DKIM signing, and DMARC alignment. Website SMTP/outbox testing is separate. Roll
back the DNS cutover if company email is impaired.

## Server baseline and layout

Inspect and record the distribution, kernel, CPU, RAM, disk/inodes, filesystem, swap, timezone,
Docker Engine/Compose/Git versions, firewall/cloud firewall, automatic updates, listening ports,
existing web servers/databases/containers/networks, and everything using 80, 443, or 5432. Do not
alter unrelated workloads.

Use `/opt/ctps/staging` for the staging checkout and keep protected operational data outside Git:

- runtime environment: `/opt/ctps/staging/.env.staging`, mode `600`;
- TLS material: `/opt/ctps/staging-runtime/tls`, restricted ownership;
- ACME webroot: `/opt/ctps/staging-runtime/acme`;
- backups: `/srv/ctps/staging-backups` with an approved encrypted off-host copy;
- release record and protected DNS export: `/opt/ctps/staging-runtime/operations`.

`compose.staging.yml` changes the Compose project name so staging database, media volumes, and the
internal network cannot collide with production. It also mounts staging-specific TLS/ACME paths.
Do not use production volumes or secrets.

## Checkout and environment

Clone or update with a fast-forward-only workflow and record the immutable SHA:

```sh
git checkout staging
git pull --ff-only origin staging
test -z "$(git status --porcelain)"
git rev-parse HEAD
```

Copy `.env.production.example` to the ignored `.env.staging`, replace every placeholder, and add
these host-only Compose values:

```dotenv
CTPS_ENV_FILE=.env.staging
CTPS_STAGING_TLS_DIR=/opt/ctps/staging-runtime/tls
CTPS_STAGING_ACME_DIR=/opt/ctps/staging-runtime/acme
```

Required staging values include:

```dotenv
NODE_ENV=production
RELEASE_VERSION=<exact-staging-git-sha>
WEB_URL=https://staging.ctpspropertysolutions.com
ADMIN_URL=https://admin.staging.ctpspropertysolutions.com
API_URL=http://api:4000
NEXT_PUBLIC_SITE_URL=https://staging.ctpspropertysolutions.com
PUBLIC_INDEXING_ENABLED=false
PUBLIC_HOST=staging.ctpspropertysolutions.com
ADMIN_HOST=admin.staging.ctpspropertysolutions.com
CORS_ALLOWED_ORIGINS=https://staging.ctpspropertysolutions.com,https://admin.staging.ctpspropertysolutions.com
AUTH_COOKIE_SECURE=true
TRUST_PROXY_HOPS=1
```

Generate independent staging database/session credentials and configure staging-only public/private
media roots, backup roots, and email values. Keep `API_URL` internal: the established Web/Admin BFF
architecture does not require a public API hostname. Never place SMTP, database, session, SSH, or
Cloudflare credentials in Git or command arguments. Initially use `log-safe` or an explicitly
authorized controlled inbox; production environment validation intentionally requires SMTP, so
validate the deliberate staging exception separately before enabling real delivery.

## Compose deployment

Set one command prefix and use it consistently:

```sh
compose='docker compose --env-file .env.staging -f compose.production.yml -f compose.staging.yml'
$compose config --quiet
$compose build
$compose up -d postgres
$compose ps
$compose --profile tools run --rm migrate
$compose up -d api web admin nginx
$compose ps
```

Review pending migrations before `migrate`; never use `prisma db push`. Run the compiled,
idempotent authentication and marketing initializers inside the API image. Bootstrap the staging
Super Admin interactively only after the authorized operator supplies a password through the
existing secure prompt. Do not initialize development pricing or publish fake Projects, reviews, or
Blog posts. The estimator must remain unavailable while only `2026-Q3-DRAFT` is effective.

Nginx is the only service published on 80/443. PostgreSQL, Web, Admin, and API stay internal; do not
publish 3000, 3001, 4000, or 5432. Confirm host and cloud firewalls permit only approved SSH, HTTP,
and HTTPS. Establish valid public certificates before enabling Full (strict), redirect HTTP to
HTTPS, verify renewal, and do not enable HSTS preload.

## Acceptance

From inside the API container, verify `/health`, `/health/database`, and `/health/ready`; externally,
verify the Web/Admin Nginx health routes and normal HTTPS behavior. Check that health responses show
the recorded release SHA. Inspect structured logs for request IDs and ensure bodies, passwords,
cookies, tokens, SMTP credentials, private media paths, and customer data are absent.

Verify `/robots.txt` disallows crawling, rendered public pages carry `noindex`, and the staging
sitemap is empty/disabled while `PUBLIC_INDEXING_ENABLED=false`. Never submit the staging sitemap.
Search rendered HTML and email output for localhost, loopback, example, or development links.

Use an anonymous browser for Homepage → Services → service detail → Projects → Request a Quote →
Contact. Use authenticated Admin separately for Dashboard, Projects, Messages, Quotes, Pricing,
Estimator Results, Jobs, Blog/editor, Pages, Media Library, Navigation, Site Settings, SEO, and
Users/Roles. Verify light/dark/system persistence, secure/HttpOnly/SameSite cookies, origin/CORS and
CSRF enforcement, correct proxy client IP/rate limiting, private-media denial, safe 404/errors, and
clean console/network output.

Test Web at 390, 768, 1024, 1152, 1366, 1440, and 1920 pixels and Admin through 1440. Through the
complete proxy chain, test representative bounded uploads and container recreation. Do not globally
cache Admin, API, Quote, Contact, estimator results, preview routes, or private media.

Submit one disposable Quote and Inquiry using controlled staging addresses. Confirm database
persistence, durable staff/customer outbox rows, Admin visibility, private media, and idempotency;
then remove/archive all QA data. Exercise pending, sent, and failed/retry behavior without contacting
unintended recipients. Website SMTP success does not replace the company-mail DNS tests.

## Schedulers, backup, restore, and persistence

Verify, but do not silently enable production schedules for:

- `pnpm email:process-outbox` every minute;
- `pnpm blog:publish-due` every minute;
- `pnpm jobs:send-reminders` every five minutes;
- `pnpm maintenance:cleanup-dry-run` before any approved cleanup;
- database/media backups on the approved staging schedule.

Use the locking, service-user, environment-loading, and logging guidance in `scheduled-tasks.md`.
Create a real custom-format PostgreSQL backup and media archive, verify both SHA-256 checksums, and
copy them to the approved off-host target. Restore into a separate temporary database and empty media
directory only. Verify representative data/private boundaries, then remove only the isolated restore
resources. Never restore over active staging during a rehearsal.

Create safe staging settings/media, recreate application containers without deleting volumes, and
confirm database, media, and settings persist. Reboot only after recovery SSH has been verified in a
separate session; otherwise record the reboot test as blocked.

## Smoke, update, and rollback

Set the three `SMOKE_*_URL` values to the actual staging routes and run `pnpm smoke` from an approved
operator context. Verify Homepage, Projects, Services, Contact, Quote, Admin login, API health,
robots/noindex, headers, cookies, redirects, and expected estimator unavailability.

For future updates: record the current SHA/images and backups, `git pull --ff-only origin staging`,
review migrations, build exact-SHA images, run forward-compatible migrations, recreate only changed
services, then repeat health and browser smoke checks.

For rollback, retain the previous SHA/images and persistent volumes. Revert application images only
when compatible with the migrated schema. Do not assume Prisma migrations can be safely downgraded;
prefer a reviewed corrective forward migration. Recheck health, logs, customer flows, Admin, media,
and outbox after rollback.
