# CTPS Cleaning Website

CTPS Cleaning is a VPS-portable public website, protected staff application, and API. Phases 1–3
provide the monorepo foundation, premium design system, PostgreSQL-backed staff authentication,
server authorization, user/role administration, and audit foundation. Later business features are
not implemented.

## Workspace

- `apps/web` — public Next.js foundation page on port 3000
- `apps/admin` — protected staff administration on port 3001; `/design-system` retains the Phase 2 demonstration
- `apps/api` — authoritative NestJS authentication and administration API on port 4000
- `packages/*` — database and minimal shared foundations
- `docs` — authoritative Phase 0 requirements
- `infrastructure` — production-infrastructure deferral notice only

## Prerequisites

- Node.js 22.x
- pnpm 10.x (Corepack is acceptable)
- Docker with Docker Compose

## Environment setup

Copy the example file before running applications:

```powershell
Copy-Item .env.example .env
```

The committed values are local-development examples, not production credentials. Never commit
`.env` or real secrets. The apps load this single root file; no per-app environment files are
needed. Browser code receives no secrets and does not connect to PostgreSQL.

## Install and start

```powershell
pnpm install
pnpm db:start
pnpm db:generate
pnpm db:migrate
pnpm auth:initialize
pnpm auth:bootstrap-super-admin
pnpm dev
```

The database is deliberately started separately from `pnpm dev`. Apply the reviewed Phase 3
migration, initialize idempotent system access, and create the initial Super Admin through the
masked trusted-terminal command. `db:push` is only for disposable local development and does not
replace reviewed migrations.

Individual applications can be run with `pnpm --filter @ctps/web dev`,
`pnpm --filter @ctps/admin dev`, or `pnpm --filter @ctps/api dev`. Shared packages are built first
by Turborepo when using the root `dev` command.

## Health and ports

| Service                | Default | Check                                   |
| ---------------------- | ------: | --------------------------------------- |
| Public web             |    3000 | <http://localhost:3000>                 |
| Admin                  |    3001 | <http://localhost:3001>                 |
| API                    |    4000 | <http://127.0.0.1:4000/health>          |
| API database readiness |    4000 | <http://127.0.0.1:4000/health/database> |
| PostgreSQL             |    5432 | internal readiness through the API      |

`WEB_PORT`, `ADMIN_PORT`, `API_PORT`, and `POSTGRES_PORT` are documented in `.env.example`. The
Next.js development scripts use the configured web/admin values, and the API validates its port.

## Quality commands

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:runtime
```

Use `pnpm format` to apply formatting. Database helpers include `db:migrate`, development-only
`db:push`, `db:studio`, `db:logs`, and `db:stop`. After a successful build and with PostgreSQL
healthy, `verify:runtime` starts the three built applications, probes both API health endpoints and
both status pages, then shuts the application processes down.

## Troubleshooting

- **Environment validation fails:** confirm `.env` exists and URLs, port numbers, and CORS origins
  match `.env.example`.
- **Database status is unavailable:** run `pnpm db:start`, wait for the Compose health check, and
  confirm `DATABASE_URL` matches the container values.
- **Generated Prisma client is missing:** run `pnpm db:generate` before building the API.
- **A port is occupied:** change the relevant port in `.env`; keep URLs and CORS origins aligned.
- **Docker reports configuration access warnings:** verify the current account can read its Docker
  client configuration and access the Docker engine.

Stop local PostgreSQL with `pnpm db:stop`. See
`docs/authentication-authorization-implementation.md` for the Phase 3 security design. Quote,
estimator, blog, project, media, email-delivery, customer-authentication, and production deployment
features remain unimplemented.
