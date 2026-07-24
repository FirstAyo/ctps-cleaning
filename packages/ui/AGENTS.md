# Shared UI Package Guidance

## Purpose

This package will own reusable, accessible visual primitives and shared design tokens. Public composition may be expressive; admin composition may be denser. Primitives must not fetch business data or contain public/admin authorization logic.

## Component rules

- Use semantic HTML, strict TypeScript, keyboard support, visible focus, accessible names and states, responsive behavior, and reduced-motion support.
- Build reusable APIs with intentional variants instead of duplicated components. Avoid unnecessary wrappers and excessive abstraction.
- Adapt shadcn/ui components to this system; do not copy them blindly.
- Use tokens instead of hardcoded brand values. Support light and dark themes with accessible contrast.
- Document non-obvious state, focus, measurement, and interaction behavior. Test complex interactive components and accessibility-critical paths.
- Keep data loading, domain policy, authorization, and page-specific orchestration outside primitives.

## Token contract

Centralize semantic colors; typography families, scale, weight, and line height; spacing; radius; shadows; borders; z-index layers; breakpoints; motion durations and easing; container widths; and form dimensions. Tokens should express purpose (for example `surface`, `text-muted`, `danger`) rather than a one-off page value.

## Planned component families

Button, Link, Input, Textarea, Select, Checkbox, Radio Group, Badge, Card, Dialog, Drawer, Dropdown Menu, Tabs, Accordion, Tooltip, Toast, Skeleton, Empty State, Error State, Pagination, data-table primitives, File Uploader, and Image Comparison. Every component must define disabled, loading, error, focus, and dark-theme behavior where applicable.
