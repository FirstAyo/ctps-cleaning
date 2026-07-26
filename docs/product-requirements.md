# Product Requirements

## Purpose

This document defines the confirmed product scope and guards future planning from being mistaken for shipped behavior. CTPS serves residential and commercial customers in Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver, British Columbia. The initial release is English-only.

## Product outcomes

The planned platform will help visitors understand CTPS services, view credible project work, obtain a preliminary price range, and submit a quote request without creating an account. Staff will eventually manage content, requests, pricing, media, users, roles, and permissions in a protected dashboard.

## Confirmed capabilities to plan

- Public marketing pages for window cleaning, pressure washing, gutter cleaning, moss removal, and configurable vent-cleaning types.
- Database-driven services and service areas with public visibility, availability, ordering, and SEO controls.
- Managed before-and-after projects with accessible comparison experiences.
- Guest quote requests supporting one or more services, property and contact details, optional photos, preferred dates, consent, confirmation, and a unique reference number.
- A deterministic estimator that returns preliminary minimum/maximum ranges and converts retained answers into a quote request.
- A self-hosted blog with authors, workflow, taxonomy, media, revisions, scheduling, preview, search, feeds, sitemaps, and SEO. Public comments and discussion are excluded.
- Private staff operational jobs created from eligible accepted quotes or separate staff entry, with Vancouver scheduling, assignments, fulfilment history, checklists, notes, incidents, and private media. This does not provide public direct booking or customer self-service.
- Flexible Users -> Roles -> Permissions authorization, including a secure initial Super Admin setup and server enforcement.
- A private/public media boundary and a migration path from VPS storage to S3-compatible storage.
- Analytics and reporting are planned capabilities; exact measures and tooling remain unresolved.

## Customer workflow and terminology

The first release does not confirm appointments online:

`Browse -> estimate or request quote -> provide details/photos -> submit -> receive reference -> staff review -> staff contact`

A **preliminary estimate** is a non-binding computed range. A **formal quote** is prepared or approved by CTPS after review. A **booking** is a separately confirmed future appointment. UI and email must never collapse these terms.

## Users and access

Public visitors do not need accounts for quote requests. Customer accounts are a possible future capability, not first-release scope. Staff access is authenticated. Authors can create, edit, preview, and publish their own posts and manage related media/SEO, but cannot access customers, quotes, pricing, users, permissions, settings, audit logs, or internal notes. Admin access is permission-based; Super Admin can manage roles and privileges.

## Data and configuration principles

Service content, service types, locations, publishing data, and supported pricing-rule values should ultimately be database-managed. Application code owns validation, authorization, workflows, calculation order, supported pricing rule types, and security. Money uses decimal-safe arithmetic. No arbitrary executable configuration is allowed.

## Quality constraints

The experience must be responsive, accessible, secure, privacy-preserving, SEO-capable, and deployable to a standard Linux VPS. It must support light/dark themes, semantic navigation, keyboard operation, visible focus, reduced motion, and resilient loading/error states. Do not invent pricing, testimonials, reviews, customer records, contact details, or business claims.

## Out of scope or unresolved

Public comments, public direct booking, customer accounts, customer self-service scheduling, payments, invoicing, and public job tracking are excluded. Private staff job scheduling, assignment, and completion records are implemented in Phase 9. Analytics provider, SMTP vendor, storage provider, retention periods, malware scanning, and exact performance targets require later decisions.
