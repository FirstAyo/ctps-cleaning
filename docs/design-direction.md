# Design Direction

## Purpose

This document sets the visual and interaction direction for public and admin experiences. Phase 2 implements the shared foundation documented in `design-system-implementation.md`; Phase 3 implements protected administration; and Phase 4 applies the system to the static public marketing website documented in `public-marketing-implementation.md`.

## Brand character

CTPS should feel modern, premium, trustworthy, clean, professional, robust, calm, accessible, responsive, and conversion-focused—never like a generic cleaning-company template. Use strong editorial typography, generous spacing, high-quality property imagery, selective radii, thin borders, subtle shadows, and clear hierarchy.

The implemented semantic palette uses a deep navy for premium and sidebar surfaces, warm off-white light backgrounds, clean blue primary actions, restrained green accents and success states, and neutral blue-grays. Values are defined as OKLCH tokens with complete light and dark mappings; final external brand approval remains required. Avoid bright gradients, pervasive glassmorphism, oversized rounded cards, decorative blobs, random icons, competing accents, heavy animation, constant carousels, and stock-layout repetition.

## Composition

Public pages may use asymmetry, editorial image crops, varied content scale, and deliberate whitespace. Repeated content should not default to identical cards when hierarchy would communicate more. Admin pages share brand tokens but use denser layouts, restrained surfaces, predictable placement, and operational clarity.

## Tokens and branding

Centralize semantic colors, typography, spacing, radius, shadows, borders, z-index, breakpoints, motion, container widths, and form dimensions in the shared UI system. Central branding configuration should supply logo/variant, favicon, business name, verified contact details, social links, brand colors, and default metadata. The existing CTPS logo can replace a development placeholder without component-by-component edits.

## Themes

Support accessible light and dark themes, defaulting to the system preference until a manual choice is made. Persist a manual preference where practical without a theme flash. Both themes require contrast, focus, disabled, error, success, chart/status, and image-overlay review; dark mode is designed, not mechanically inverted.

## Type, imagery, and icons

Choose a readable editorial display/body pairing with restrained weights and fluid, bounded sizing. Body measure should remain comfortable. Use real, approved CTPS imagery when available; never imply stock photos are actual projects. Responsive crops must preserve the subject. Use a coherent, minimal icon set only when an icon improves recognition; pair unfamiliar icons with text.

## Interaction and accessibility

Controls must have stable hover, active, disabled, loading, error, and visible focus states. Target sizes and spacing must support touch. Motion clarifies hierarchy or state and never blocks input; prefer CSS, keep duration short, avoid heavy parallax, and honor `prefers-reduced-motion`. Semantic HTML, keyboard navigation, skip links, landmarks, announcements, zoom/reflow, and non-color status cues are baseline requirements.

## Responsive direction

Design mobile-first around content needs rather than device names. Collapse asymmetrical compositions into an intentional reading order, avoid horizontal page scrolling, keep calls to action reachable, and replace dense tables with accessible responsive alternatives only when meaning is preserved.
