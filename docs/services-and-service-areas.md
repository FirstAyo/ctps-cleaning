# Services and Service Areas

## Purpose

This document defines the planned configurable service catalogue and geographic availability without inventing content or pricing.

## Confirmed initial catalogue

CTPS serves residential and commercial customers with window cleaning, pressure washing, gutter cleaning, moss removal, and vent cleaning. Vent cleaning must support independently configurable types such as dryer vents, bathroom exhaust vents, HVAC/duct-related cleaning, and commercial vent cleaning; not every type must be active at launch.

Initial areas are Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver, British Columbia.

## Service model guidance

Each service/type should eventually support name, slug, short/full descriptions, active and featured states, public visibility, estimator and quote availability, SEO metadata, featured image, and display order. Stable identifiers should not depend on editable slugs. Content belongs in data/configuration, not permanently embedded in UI components.

Service-specific quote and estimator questions require versioned, typed definitions and server validation. Availability for marketing, estimator, and quote request are distinct flags: a public page may exist while estimation is unavailable.

## Area model guidance

Each area should support name, slug, province, active/public states, per-service availability, estimator availability, typed travel/service-area adjustments, SEO metadata, structured-data inputs, and display order. Model service-to-area availability explicitly rather than assuming every combination.

Addresses must be server-validated against supported areas before estimator or quote acceptance. Exact geocoding/provider and boundary policy remain unresolved; a city selection alone may not prove serviceability.

## Publishing and SEO

Service and area pages require canonical slugs, metadata, related content, availability CTAs, and structured data generated only from verified business data. Area pages must contain genuinely useful local information and projects; do not generate duplicate thin pages or fake local claims.

## Pricing relationship

Pricing records reference stable service/type and area identifiers with effective dates and active state. The database stores allowed configuration; the pricing package owns calculation meaning, ordering, conflicts, bounds, decimal arithmetic, and rounding. No values are defined in Phase 0.

## Lifecycle constraints

Prefer deactivate/unpublish over destructive deletion when records are referenced by quotes, estimates, projects, posts, or audit history. Preserve historical labels/snapshots where business records must remain understandable after catalogue edits.
