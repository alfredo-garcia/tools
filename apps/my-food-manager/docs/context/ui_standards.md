# UI Standards: My Food Manager

> Project: `my-food-manager`
> Status: Approved (2026-10-28)
> Reference render: `prototypes/style-guide.html` (clickable approximation; tokens below are authoritative)

## 1. Brand Voice & Tone
- **Personality:** appetizing, direct, warm, quick. Nothing corporate.
- **Voice in UI copy:** Spanish (Spain), second person informal, short. Good: "Te faltan 3 ingredientes". Bad: "Se han detectado ingredientes no disponibles en su despensa".
- **What to avoid:** exclamation-heavy cheer, jokes in error messages, English strings in the UI, long explanations. Errors say what happened and what to do next ("Sin conexión. Se guardará al volver").

## 2. Color Tokens
Dark is the default design; light follows the device setting (`prefers-color-scheme`) with a manual override. Components use semantic tokens only, never raw hex.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `color.bg` | `#15130F` | `#FBF7F1` | Page background |
| `color.surface.1` | `#1F1C17` | `#FFFFFF` | Cards, nav, sheets |
| `color.surface.2` | `#2A2620` | `#F3EDE3` | Chips, inputs, secondary buttons |
| `color.border` | `#38332B` | `#E4DACB` | Dividers, outlines |
| `color.text` | `#F6EFE4` | `#1E1A14` | Body text |
| `color.text.muted` | `#A99F90` | `#6B6254` | Secondary text, metadata |
| `color.primary.500` | `#FF7A45` | `#C2410C` | Primary action, active state |
| `color.primary.contrast` | `#15130F` | `#FFFFFF` | Text/icons on primary |
| `color.accent.lime` | `#B7E04A` | `#4D7C0F` | Favorites, "can cook now" accent |
| `color.success.500` | `#7BD88F` | `#2E7D32` | Done, synced |
| `color.warning.500` | `#F2C14E` | `#B7791F` | Offline, pending changes |
| `color.danger.500` | `#FF6B6B` | `#B42318` | Errors, destructive |
| `cat.<id>` | see below | same | Tint of the photo-fallback tile per recipe category |

Category colors (`cat.breakfast #F2C14E`, `starters #F28B6B`, `soups #E0A458`, `salads #7BD88F`, `mains #FF7A45`, `sides #B7E04A`, `sauces #E4572E`, `breads #D9A66B`, `desserts #F58FB5`, `drinks #6FC3E8`) are used only for tiles and category chips, never for text.

- **Contrast:** WCAG AA (4.5:1 body, 3:1 large text and UI). Primary pairs above were chosen to meet it.
- **Semantic vs raw:** components reference semantic tokens (`color.primary.500`); no raw palette tokens exist.

## 3. Typography
- **Font:** Inter, fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Style | Size / weight / line height | Usage |
|---|---|---|
| `display` | 32 / 800 / 1.15 | Hero headline on home |
| `heading-1` | 24 / 800 / 1.15 | Screen titles, recipe title |
| `heading-2` | 18 / 700 / 1.25 | Section headers (Ingredientes, Pasos) |
| `body` | 16 / 400 / 1.5 | Default text, steps |
| `label` | 14 / 600 / 1.3 | Chips, buttons, field labels |
| `caption` | 12 / 500 / 1.35 | Metadata, badges |

Aisle headers use caption, uppercase, 800 weight, +0.06em tracking.

## 4. Spacing & Layout Scale
- **Base unit:** 4px. `space.xs 4`, `sm 8`, `md 16`, `lg 24`, `xl 32`. No in-between values.
- **Breakpoints:** `small <640`, `medium 640-1279`, `large >=1280` (px). The width is the window width; there is no separate mobile/desktop detection.
- **Grid:** recipe tiles 2 columns on small, 3 on medium, 4 on large; gutter `space.md` (12px for tile grids); page margin `space.md`. Desktop content max width 1180px; list/detail screens max 720px centered, except the recipe detail side panel in the large layout, which fills the width left by the 400px list column.

## 5. Iconography
- **Set:** `lucide-react` only.
- **Sizes:** 14 (inline metadata), 20 (default), 24 (nav), 28 (primary callouts).
- **Style:** outline, 2px stroke, round caps. Heart and star fill when active.
- **Food emoji** are allowed as category and fallback-tile glyphs (text, not icons); they never replace functional icons.

## 6. Elevation, Shadow & Radius
| Token | Value | Usage |
|---|---|---|
| `radius.sm` | 10px | Checkboxes, small controls |
| `radius.md` | 18px | Cards, tiles |
| `radius.lg` | 28px | Bottom sheets (top corners) |
| `radius.full` | 999px | Buttons, chips, inputs, badges |
| `elevation.1` | `0 1px 2px` black 40% (dark) / warm 12% (light) | Resting cards |
| `elevation.3` | `0 18px 40px` black 55% (dark) / warm 20% (light) | Sheets, toasts |

## 7. Motion & Animation Principles
- **Durations:** `duration.fast 120ms` (press), `duration.base 150-250ms` (sheets, tiles).
- **Easing:** ease-out for entrances, ease-in for exits.
- **Rules:** animate layout-affecting changes (sheet open, list item done); no decorative loops except the loading spinner. Respect `prefers-reduced-motion` (disable transitions and animations).

## 8. Accessibility Standards
- **Contrast:** WCAG AA.
- **Touch targets:** minimum 44x44px; primary buttons and inputs 48-52px high; list rows at least 56px.
- **Focus:** visible 3px ring in `color.primary.500` at 55% alpha on every interactive element; never rely on color alone for state (toggled chips also change fill and border, done items are struck through).
- **Screen readers:** icon-only buttons need `aria-label`; toggles use `aria-pressed`; current tab uses `aria-current="page"`; sync/offline status changes are announced via a polite live region.
- **Motion:** reduced-motion fallback per §7.

## 9. Platform Conventions
Web only (responsive PWA, mobile-first).
- **Interaction model:** touch first. No hover-only affordances; anything revealed on hover (desktop) must be always visible on touch.
- **Navigation container:** mobile: bottom tab bar (Inicio, Recetas, Lista, Despensa). Desktop (>1024px): the same four destinations as a left sidebar.
- **Overlays:** small: bottom sheet for quick actions (rate, pick); medium: centered modal; large: side panel for the same content. The recipe detail is full screen on small, a modal (max 720px) on medium and a panel beside the list on large. Full-screen takeover only for the cook view.
- **Gestures:** horizontal scroll for chip rows; pull-to-refresh triggers a Drive sync; no other custom gestures in the MVP.
- **Offline:** an offline badge appears at the top of every screen when disconnected; pending changes are counted; never block reads.

## 10. Design Token Naming Convention
- **Pattern:** `category.variant.step`, e.g. `color.primary.500`, `space.md`, `radius.sm`, `cat.mains`.
- **CSS mapping:** dots become dashes with a `--` prefix: `color.primary.500` → `--color-primary-500`. Tailwind theme extends these variables; light/dark values switch on `:root[data-theme]` and `prefers-color-scheme`.
- **Platform equivalents:** none (web only).

## 11. Do's and Don'ts
- Photo first: every recipe tile has the same 4:3 area; with no photo, use the category gradient + emoji, never an empty gray box.
- Show cooking time (clock icon) and difficulty (flame icon) on every recipe tile.
- Primary buttons are `color.primary.500` pill buttons, one per screen section; destructive actions use `color.danger.500` outline.
- Filters are chips in a horizontal scroll row; active chips use soft-tinted fill + colored border, favorites use the lime variant.
- Don't use pure black or pure white for text on dark/light backgrounds; use `color.text`.
- Don't add a raw hex color in components; add a token here first.

## 12. Versioning
- **Last updated:** 2026-10-28
- **Owner:** Al
- Initial version.
