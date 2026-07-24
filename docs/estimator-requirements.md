# Estimator Requirements

## Purpose

The planned estimator provides reproducible preliminary price ranges. It is neither a formal CTPS quote nor a confirmed booking.

## Public flow

Visitors select one or more estimator-enabled services, residential/commercial property type, service area, and conditional details. Contact information is optional until quote conversion. A successful result presents minimum/maximum range, safe calculation summary, Edit Answers, Start Over, and Convert to Quote. Conversion preserves validated answers.

Display this meaning prominently: “This is a preliminary, non-binding estimate. Final pricing may change after CTPS reviews the property details, measurements, condition, access requirements, photos, and requested services.”

## Hybrid boundary

Authorized staff may manage database configuration: base min/max, minimum charges, per-unit min/max, property/storey/condition/access/area/bundle/seasonal adjustments, effective dates, status, estimator availability, priority, and public explanation labels.

Code owns supported rule types, schemas, order of operations, range combination, decimal-safe arithmetic, rounding, priorities, conflicts, boundaries, invalid-configuration behavior, audit behavior, and breakdown production. Storage must never contain executable JavaScript, SQL, templates, code, or unrestricted formulas.

## Determinism and money

The same normalized inputs and rule-set version must produce identical results. Use decimal or integer-minor-unit arithmetic, never JavaScript binary floating point directly. Define one rounding policy before implementation and round at explicit stages. No random values, silent fallback prices, or invented defaults.

Each calculation should record safe input references, rule/version identifiers, effective time, ordered adjustments, pre/post bounds, rounding, and outcome. Public output exposes only approved explanation labels and result ranges; full configuration is confidential.

## Administration

The pricing UI should filter rules by service/status, create/edit/deactivate typed rules, set effective dates/priority, preview examples, flag conflicts and invalid ranges, compare old/new values, require confirmation for major changes, and record audit history. It must not offer a free-form formula field.

## Failure behavior and tests

Unavailable services, missing/invalid configuration, impossible inputs, effective-date gaps, conflicting equal-priority rules, and boundary overflow fail safely with a non-price state and quote-request alternative where appropriate. Test normal and combined rules, min/max invariants, minimum charges, rounding, dates/time zones, priorities, conflicts, boundaries, invalid rules, multiple services, and repeatability.

## Unresolved decisions

Supported rule catalogue, currency/storage scale, tax treatment, rounding increment, combination order, cap/floor policy, rule approval threshold, estimate expiry, and what breakdown labels are public must be approved before implementation.
