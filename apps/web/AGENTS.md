# Public Web Application Guidance

## Purpose

This directory is reserved for the planned public Next.js application. Follow the root `AGENTS.md`, `docs/public-ui-specification.md`, and `docs/design-direction.md`.

## Rules

- Preserve a premium, calm, conversion-focused identity; do not substitute a generic cleaning template.
- Work mobile-first and optimize public performance, Core Web Vitals, image delivery, and progressive loading.
- Use Server Components by default. Introduce Client Components only for browser state or interaction, and keep their boundaries small.
- Generate accurate SEO metadata, canonical URLs, sitemaps, and validated structured data from trusted content. Do not invent business facts.
- Use semantic landmarks, skip links, keyboard-operable controls, visible focus, sufficient contrast, and accessible status announcements.
- Respect reduced motion. Prefer CSS transitions for simple effects and use Motion for React only where it improves comprehension.
- Public forms must use visible labels, accessible errors, server validation, safe retry behavior, privacy copy, and abuse controls.
- Quote requests remain requests, not confirmed bookings. Estimator results must be preliminary, non-binding ranges and must not reveal private rules.
- Before-and-after controls require pointer, touch, keyboard, and non-slider fallback experiences.
- Sanitize rich blog content and optimize responsive images without exposing private media URLs.
- Never render customer data, internal notes, private uploads, staff-only records, or confidential pricing configuration.
