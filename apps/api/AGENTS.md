# API Application Guidance

## Purpose

This directory is reserved for the planned NestJS API and trusted business boundaries. Follow the root guidance and architecture and security documents.

## Boundaries

- Organize NestJS by cohesive domain modules. Controllers translate transport concerns, services orchestrate use cases, and repositories isolate persistence. Do not place business rules in controllers or database-access code.
- Use stable, documented response and error structures. Support bounded pagination and deterministic ordering for collections.
- Validate and normalize every DTO at entry. Use Zod at shared or explicitly documented validation boundaries; do not duplicate contradictory schemas.

## Security and operations

- Authenticate staff routes and enforce permissions server-side at both use-case and resource-ownership boundaries.
- Prevent mass assignment and insecure direct object references by allowlisting mutable fields and authorizing the loaded resource.
- Apply endpoint-appropriate rate limiting and idempotency for retry-prone submissions or side effects.
- Validate file type by content, size, dimensions, count, and ownership; store customer uploads privately and authorize access through controlled responses.
- Return safe errors; do not expose stack traces, secrets, storage paths, or internal pricing configuration.
- Use structured logs with request correlation. Never log secrets, passwords, tokens, uploaded content, or unnecessary customer data.
- Emit audit events for sensitive changes with actor, action, resource, time, and safe old/new summaries.
