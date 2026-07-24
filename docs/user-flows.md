# User Flows

## Purpose

This document describes planned end-to-end behavior and critical recovery paths. It does not indicate that any flow is implemented.

## Browse and request a quote

1. Visitor discovers a service or service-area page.
2. Visitor selects one or multiple available services and residential/commercial context.
3. The form gathers service-specific property details, address/service area, contact details, preferred dates, notes, consent, and optional photos.
4. The visitor reviews and submits. Client validation improves usability; the server revalidates, rate-limits, and authorizes upload associations.
5. On success, the system displays and emails a unique reference number. This confirms receipt only.
6. Authorized staff reviews details/photos, records internal notes, changes status, and contacts the customer.

Recoverable errors preserve non-sensitive answers and identify affected fields. Upload failures can be retried or removed without duplicating the request. Duplicate submission protection is recommended. Guest progress is limited to the current browser session unless a secure recovery design is approved; do not promise cross-device saving.

## Preliminary estimator to quote

1. Visitor chooses supported services, customer/property type, service area, and conditional details.
2. API validates answers and loads active, effective, compatible pricing configuration.
3. Code-controlled engine returns a deterministic range and safe explanation or an unavailable/configuration error.
4. UI labels the result non-binding and offers Edit Answers, Start Over, or Convert to Quote.
5. Conversion carries validated answers into the quote flow; the visitor adds contact/consent/photos and reviews before submitting.

An estimate is not a formal quote and never confirms a booking. Confidential rule details remain server-side.

## Staff quote review

Authorized staff opens a filtered request list, views only permitted customer data, reviews uploads through authorized private access, adds internal notes, and changes status with audit history. High-impact or irreversible actions require confirmation. Expected states include New, Under Review, More Information Required, Estimate Reviewed, Quote Prepared, Contacted, Accepted, Declined, Closed, and Cancelled; final transition rules remain to be defined.

## Author publishing

An Author creates a draft, edits title/content/taxonomy/featured image/SEO, previews it, and may publish their own post. Scheduling may be added with server-controlled time handling. Ownership checks occur on every read and mutation. Revision history and publishing history remain visible to the author. Other staff content requires a separate permission.

## Super Admin access management

The initial Super Admin is provisioned through a secure setup mechanism. A Super Admin creates/disables users, creates roles, groups and assigns permissions, and reviews confirmation/change summaries. The system prevents removal or disablement of the final active Super Admin and records an audit event.

## Managed content and media

Authorized users create services, areas, projects, posts, and media metadata according to permissions. Public publishing validates slugs, visibility, SEO, relationships, and required accessible text. Public media is optimized and addressable; private quote uploads require authorized access. Safe deletion checks references and retention policy.
