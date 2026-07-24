# CTPS Cleaning Repository Guidance

## Purpose and authority

This repository is planned for the CTPS Cleaning platform. Before changing anything, inspect the repository, read the relevant documents in `docs/`, and read this file plus the nearest applicable `AGENTS.md`. Explicit user instructions are authoritative. If guidance conflicts or a requirement is unclear, stop and report the conflict rather than guessing.

Phase 0 contains documentation only. Do not claim a planned capability exists until it has been implemented and verified.

## Change discipline

- Preserve working architecture and approved UI. Do not change the visual direction without explicit instruction.
- Keep changes scoped; avoid unrelated refactors, speculative features, and premature abstractions.
- Keep public web, admin, API, database, pricing, and shared UI responsibilities separated.
- Use descriptive names and focused functions and modules.
- Use strict TypeScript. Avoid `any` unless its narrow use is explicitly justified and documented.
- Validate all external input at a trusted boundary. Sanitize rich content before rendering.
- Add or update tests whenever behavior changes.

## Web and accessibility

- In Next.js, use Server Components by default; add Client Components only when browser interaction requires them.
- Build mobile-first with semantic HTML, keyboard navigation, visible focus states, accessible names, sufficient contrast, and reduced-motion support.
- Follow `docs/design-direction.md` and the relevant public or admin UI specification.

## Security and privacy

- Enforce authentication and authorization on the server. Client-side role checks, hidden buttons, and hidden navigation are never security controls.
- Use the Users -> Roles -> Permissions model; do not reduce authorization to hardcoded `role === "admin"` checks.
- Protect customer data and private uploads. Never expose internal notes, sensitive customer information, or private pricing configuration publicly.
- Apply least privilege, auditable sensitive changes, safe upload handling, and secrets management described in `docs/security-requirements.md`.

## Platform constraints

- Preserve compatibility with Docker, Docker Compose, PostgreSQL, Nginx, standard Linux VPS hosting, SMTP, and optional S3-compatible storage.
- Do not introduce dependencies on Vercel-specific services, Supabase, Firebase, Netlify-specific services, proprietary serverless databases, or vendor-locked hosting features.

## Verification and handoff

Before finishing, run the relevant linting, type checking, and tests available for the phase. Report changed files, commands run, test results, assumptions, unresolved risks, and any verification not performed. Never present unimplemented or unverified behavior as complete.
