# Pricing Package Guidance

## Purpose

This package will contain the code-controlled, deterministic preliminary estimator engine. Database records configure supported rule types; they never execute code.

## Rules

- Produce minimum and maximum ranges with decimal-safe money arithmetic and explicit, documented rounding.
- Use versioned rules, effective dates, active state, priority, deterministic conflict resolution, and stable ordering.
- Return a calculation breakdown suitable for audit and safe public explanation; do not expose confidential values or internal configuration publicly.
- Reject invalid, overlapping, contradictory, unsupported, or out-of-bound configuration safely. Never silently improvise a price.
- Do not evaluate JavaScript, SQL, templates, arbitrary expressions, or unrestricted formulas from storage.
- Do not use random pricing or JavaScript binary floating-point arithmetic for money.
- Ensure identical validated inputs and the same rule version reproduce identical results.
- Cover normal calculations, combinations, rounding, boundaries, effective-date transitions, priority conflicts, invalid rules, and unavailable services with unit tests.
- Public outputs are preliminary non-binding ranges only, never formal quotes or bookings.
