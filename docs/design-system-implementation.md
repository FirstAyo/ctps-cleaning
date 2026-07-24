# CTPS Design System Implementation

## Scope and status

Phase 2 implements the shared visual, theme, responsive, accessibility, and component foundation for `apps/web` and `apps/admin`. It is a development review system, not the final public website or a protected administration product. The admin shell is explicitly an unprotected composition demonstration; authentication, authorization, protected routes, permission-aware navigation, the production admin shell, initial Super Admin setup, and audit infrastructure remain Phase 3 work.

The primary implementation lives in `packages/ui/src`. Both applications import its semantic tokens and components. The public application demonstrates expressive editorial composition; the admin application uses the same foundation at a denser operational rhythm.

## Color tokens

Tokens are defined in `packages/ui/src/theme.css` with light values on `:root` and designed dark values on `.dark`. OKLCH is used to keep adjustments perceptually deliberate. Components use semantic Tailwind names instead of raw color literals.

| Family     | Implemented tokens                                                                                  | Purpose                                                      |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Base       | `background`, `foreground`                                                                          | Page canvas and default text                                 |
| Surfaces   | `surface`, `surface-elevated`, `surface-muted`                                                      | Standard, raised, and quiet regions                          |
| Actions    | `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground` | Calls to action, premium navy, and restrained green emphasis |
| Supporting | `muted`, `muted-foreground`, `border`, `input`, `ring`                                              | Secondary content, boundaries, controls, and focus           |
| Status     | `success`, `warning`, `destructive`, `info`                                                         | Text-and-color state communication                           |
| Components | `card`, `card-foreground`, `popover`, `popover-foreground`                                          | Reusable surface contracts                                   |
| Admin      | `sidebar`, `sidebar-foreground`, `sidebar-muted`, `sidebar-border`, `sidebar-accent`                | Dense admin navigation composition                           |

Pure black is not used as the universal dark surface. Important copy uses foreground tokens, while muted text is reserved for supporting information. Status components always retain text or symbols so color is not the only cue.

## Typography

The default sans stack is local/system-based: Inter when locally available, then platform UI fonts. This avoids a runtime third-party request. Georgia is the restrained editorial display fallback for public headings, and a local monospace stack supports token and technical labels.

- Public display: fluid `clamp(2.5rem, 7vw, 5.5rem)`, compact line height, editorial serif.
- Public section heading: fluid `clamp(2rem, 4vw, 3.5rem)`.
- Admin page heading: fluid `clamp(1.65rem, 3vw, 2.25rem)`, dense sans-serif.
- Body large: 1.125rem with relaxed line height.
- Body: inherited 1rem with 1.6 line height.
- Body small, label, caption, and overline: reusable Tailwind scale, weight, and tracking combinations shown in the galleries.
- Code and tokens: local monospace stack.

Reading copy is constrained to roughly 65–70 characters where used. Font size, weight, family, spacing, and color work together to establish hierarchy.

## Spacing and containers

The system uses the Tailwind spacing scale with repeated conventions rather than unrelated one-off values. Public `Section` spacing is generous and responsive. Admin sections use smaller local gaps and padding.

`Container` supports:

- `content`: 72rem public content
- `wide`: 86rem marketing and footer composition
- `reading`: 44rem long-form measure
- `admin`: 96rem dashboard content
- `form`: 40rem form measure
- `full`: deliberate full-width composition

Shared `Stack`, `Inline`, `ResponsiveGrid`, `Section`, and `Container` primitives express recurring layout intent. Controls use a 2.75rem base height, with large actions at 3rem and icon controls at 2.75rem.

## Radius, borders, shadows, and elevation

- `radius-sm`: 0.375rem for compact controls.
- `radius-md`: 0.625rem for standard controls.
- `radius-lg`: 1rem for cards and comparison media.
- `radius-xl`: 1.5rem for selected premium public panels.
- Borders are thin semantic `border` values and remain visible in dark mode.
- `shadow-sm` supports subtle card separation.
- `shadow-md` supports important public panels and menus.
- `shadow-overlay` is reserved for dialogs, drawers, and toasts.

Focus uses a three-pixel semantic ring with offset. Elevation is not used on every component.

## Motion

Shared durations are `motion-fast` (120ms), `motion-standard` (200ms), and `motion-slow` (420ms), with a single emphasized ease curve. Buttons, disclosures, sidebars, drawers, and a restrained public reveal use CSS transitions or keyframes. No animation library was added.

The global `prefers-reduced-motion: reduce` rule removes smooth scrolling, reduces animation and transition duration to effectively immediate, and disables repeated animations. Information and control state never depend on motion.

## Theme behavior

The default preference is `system`. A small inline initialization script runs before body paint, reads `ctps-theme`, resolves the system media query, applies `.dark`, and sets `color-scheme`. This minimizes visible theme flash and avoids a post-hydration class mismatch. The root element uses `suppressHydrationWarning` only for this intentional pre-hydration state.

`ThemeProvider` listens for system-theme changes while the stored preference is absent. `ThemeToggle` cycles system → light → dark → system. Light and dark choices are stored in `localStorage`; returning to system removes the key. The control exposes the current preference in its accessible name and visible label. The implementation is shared and has no Vercel dependency.

## Component inventory

### Core interaction

`Button`, `IconButton`, `LinkButton`, `ThemeToggle`, shared focus-visible treatment, and strict button variants/sizes. Buttons forward refs and loading buttons disable repeat activation while retaining their label.

### Forms

`Input`, `Textarea`, `Select`, `Checkbox`, `RadioCard`, `Switch`, `Label`, `FormDescription`, `FormError`, and `FieldGroup`. Native controls preserve keyboard and assistive-technology behavior. Visible labels, described-by examples, associated errors, and fieldset/legend grouping are demonstrated.

### Content and state

`Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `StatusBadge`, `Alert`, `Callout`, `Separator`, `Avatar`, `Skeleton`, `EmptyState`, `ErrorState`, and `LoadingState`.

### Overlay and navigation

`Dialog`, `AlertDialog`, `Drawer`, `DropdownMenu`, `Tooltip`, `Popover`, `Tabs`, `Accordion`, `Breadcrumb`, `Pagination`, and `ToastDemo`. Dialogs use the native modal element. Drawers and application mobile menus support Escape, scroll locking, labeled close controls, and focus restoration. Tabs implement arrow, Home, and End keyboard movement. Accordions use native disclosure semantics.

### Layout and future-facing primitive

`Container`, `Section`, `Stack`, `Inline`, `ResponsiveGrid`, `VisuallyHidden`, and `ImageComparison`. The comparison is business-data independent and uses abstract token surfaces.

## Image comparison behavior

The comparison uses a native range input layered over two equally sized abstract surfaces. Pointer dragging and touch movement come from the range control. Arrow keys move by two percentage points; Shift plus Arrow moves by ten; Page Up/Down move by ten; Home/End reach the bounds. Values are clamped between zero and one hundred and announced through a live output. Persistent Before and After labels and written instructions support non-visual context. Reduced motion makes all state changes immediate. A static labeled visual and `noscript` explanation remain when scripting is unavailable; real project images and records are deferred to Phase 5.

## Public composition

The public root remains a foundation/status page and retains API/database health visibility. `/design-system` demonstrates tokens, typography, buttons, forms, cards, states, tabs, accordion, overlays, theme switching, responsive sections, motion, and the comparison prototype. It contains no final homepage copy or fabricated business information.

The public header provides semantic landmarks, skip navigation, a development brand mark, desktop links, theme control, quote-label treatment, and a mobile drawer. All demonstration links resolve to existing safe routes. The footer provides responsive placeholder link groups while explicitly omitting unknown contact and social details.

## Admin composition

The admin root states prominently that authentication is not implemented and retains Phase 1 health visibility. `/design-system` demonstrates an unprotected shell with desktop sidebar, collapsed desktop state, mobile drawer, top bar, breadcrumb, page-title region, theme control, user-menu placeholder, and content region.

Neutral examples demonstrate summary cards, semantic table markup and caption, search/filter controls, horizontal overflow, a responsive record-card alternative, pagination, form layout, dialogs, drawer, confirmation, toast, and loading/empty/error/permission/session/save/validation states. No customer or staff identity data is present, and navigation does not perform protected work.

## Accessibility conventions

- Skip links and semantic header, navigation, main, section, table, form, and footer landmarks.
- One page heading and ordered section headings in each preview.
- High-contrast focus-visible rings and touch-sized controls.
- Accessible names for icon-only and menu controls.
- Native modal semantics for dialogs, Escape behavior for drawers, background scroll locking, and trigger focus restoration.
- Keyboard tabs and image comparison behavior.
- Form labels, descriptions, error roles, fieldsets, and legends.
- Text and symbols accompany status colors.
- Live regions for changing comparison value, toasts, and state messages.
- Reduced-motion handling and responsive reflow.

Automated tests cover critical interaction paths, but manual screen-reader and browser/device review remains required before production release.

## Responsive conventions

Layouts begin as one column and expand through content-driven breakpoints. Public navigation changes to a drawer below the width needed for the full header. The admin desktop sidebar becomes a mobile drawer. Dialogs and drawers use dynamic viewport bounds, forms remain full-width, and controls keep usable target sizes. Tables use labeled horizontal overflow plus a deliberate record-card alternative. The comparison maintains a stable aspect ratio and native touch input. Normal page compositions avoid horizontal overflow.

## Usage example

```tsx
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldGroup,
  Input,
  Label,
} from "@ctps/ui";

<Card>
  <CardHeader>
    <CardTitle>Example form</CardTitle>
  </CardHeader>
  <CardContent>
    <FieldGroup>
      <Label htmlFor="example">Example label</Label>
      <Input id="example" />
    </FieldGroup>
    <Button className="mt-4">Save example</Button>
  </CardContent>
</Card>;
```

Use semantic component props and token classes. Keep API access, domain policy, authentication, authorization, and application orchestration outside `@ctps/ui`.

## Known limitations and deferred work

- Final logo files, approved imagery, verified business content, and external brand approval are unavailable.
- The system-font stack avoids production font requests; locally bundled custom font files may be evaluated later.
- The simple dropdown/popover foundations use native disclosure behavior; complex menu subnavigation should receive deeper focus-roving validation when final navigation is implemented.
- Native dialog behavior requires cross-browser manual verification and may need a focused compatibility decision before production.
- Automated contrast, screen-reader, 200% zoom, and physical touch-device audits remain release QA work.
- Storybook was not added because the two existing `/design-system` routes provide scoped review without another framework.
- Phase 3 owns authentication, sessions, Users → Roles → Permissions, server-side enforcement, protected routes, the production protected admin shell, initial Super Admin setup, and audit-log foundation.
- Phases 4–8 own final public pages and business-backed before-and-after, quote, estimator, and blog functionality.
