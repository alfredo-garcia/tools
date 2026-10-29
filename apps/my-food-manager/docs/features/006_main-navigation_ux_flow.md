# UX Flow: Main Navigation

> Project: `my-food-manager`
> Source PRD: `006_main-navigation_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/006_main-navigation/index.html` (clickable; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; sample recipe rows)
> Status: Approved by user on 2026-10-29

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Every line resolves to a concrete rendering or data instruction. Visual values come from `ui_standards.md` tokens and are not repeated here. Recipe list, filters, search and detail are not described here: they stay as specified in `003`, `004` and `005` UX Flows.

## 1. Flow Summary

A persistent navigation with four destinations frames the whole app: a bottom bar on small windows and a left sidebar (collapsible) on medium and large ones. Three destinations lead to a "Próximamente" screen.

- Any screen → (tap a destination) → that destination's screen; the destination is highlighted
- `SCR-library-list` (small window) → (open a recipe) → `SCR-recipe-detail` full screen, bottom bar hidden → (close) → `SCR-library-list`, bottom bar visible
- Medium and large windows → (tap the collapse/expand control) → sidebar changes state and the choice is stored on the device
- Unknown address → standard not-found page

## 2. Screens

### 2.1. App frame (navigation around every screen)

- **Platform**: Web. **Divergence by layout**: `small` shows `<BottomNav>`; `medium` and `large` show `<SideNav>`. Thresholds are those of `layoutForWidth`.
- **Purpose**: always-present navigation between the four sections.
- **Route / entry point**: the root layout, around every address.

**Data required**

| Field | Type | Source |
|---|---|---|
| `items` | `{ id: "recipes" \| "plan" \| "ingredients" \| "profile"; href: string; label: string; icon: LucideIcon }[]`, in this order: `recipes` "/" "Recetas" `ChefHat`; `plan` "/plan" "Plan" `CalendarDays`; `ingredients` "/ingredients" "Despensa" `Refrigerator`; `profile` "/profile" "Perfil" `User` | constant defined once in `src/lib/domain/navigation.ts`, consumed by both navs |
| `pathname` | string | `usePathname()` |
| `currentId` | destination id or `null` | `currentDestination(pathname)` (pure, domain): `"recipes"` for `/` and `/recipes/<id>`; for the others, the id whose `href` equals `pathname` or is its parent (`/plan/...`); `null` otherwise |
| `layout` | `"small" \| "medium" \| "large"` | `useLayout()` |
| `storedExpanded` | `boolean \| null` | device-local preference, key `sidebar-expanded`; `null` when absent or unreadable |
| `expanded` | boolean | `sidebarExpanded(storedExpanded, layout)` (pure, domain): `storedExpanded` when not `null`, otherwise `layout === "large"` |
| `detailOpen` | boolean | `pathname` starts with `/recipes/` |

**Component tree**

- `<AppFrame>` (new, `components/layout/AppFrame`, client component rendered in `src/app/layout.tsx` around `children`, after `<SyncStarter />`)
  - If `layout !== "small"`: `<SideNav items={items} currentId={currentId} expanded={expanded} onToggle={toggle} />` at the left, full height, followed by the content region (`flex: 1`, `min-width: 0`)
  - Content region: `children`
  - If `layout === "small"` and not (`detailOpen`): `<BottomNav items={items} currentId={currentId} />` fixed to the bottom

**Conditional rendering states**

- If `layout === "small"`, render `<BottomNav>` and no `<SideNav>`; the content region gets bottom padding equal to the bar height so nothing is hidden behind it.
- If `layout === "small"` and `detailOpen`, render no `<BottomNav>` (from the first frame of the detail, including a direct load of the address).
- If `layout !== "small"`, render `<SideNav>` and no `<BottomNav>`; `<SideNav>` stays rendered when `detailOpen` (modal on medium, panel on large).
- If `currentId === null` (unknown address), no destination is highlighted.
- If before the first client render (server render or hydration), `layout` is `"small"` and `storedExpanded` is `null`; the stored value is read after mount and applied then.
- If the stored value cannot be read (storage blocked, invalid content), treat as `null`; never throw.
- If the window is resized across 640 px, switch between the two navs immediately; the section and the open recipe are unchanged.
- If `prefers-reduced-motion` is set, the sidebar width change has no transition; otherwise it animates over `duration.base`.

**Interactions / transitions**

- Tap a destination in either nav → client-side navigation to its `href` (no full reload).
- Tap the collapse/expand control → `storedExpanded = !expanded`, written to the device preference; the stored value then applies to medium and large.
- Browser back/forward → `currentId` follows the address.
- Esc, scrim tap and close in the recipe detail keep working as in 002/004.

### 2.2. Bottom bar (`BottomNav`)

- **Platform**: Web, `layout === "small"` only.
- **Route / entry point**: rendered by `<AppFrame>`.

**Component tree**

- `<BottomNav items currentId>` (kit: `components/navigation/Nav`, registry Beta, items and props changed as in the legend) renders `<nav aria-label="Principal">` with one `<a>` per item, equal width, minimum height 64 px, bottom safe-area inset respected, background `color.surface.1`, top border `color.border`. Each `<a>` renders the item's icon (24 px) above its label (`caption`).

**Conditional rendering states**

- If `item.id === currentId`: `aria-current="page"`, text and icon in `color.primary.500`, icon stroke heavier, and a 3 px bar of `color.primary.500` at the top edge of the item (state is not shown by color alone).
- Otherwise: text and icon in `color.text.muted`.
- Labels are always visible.

### 2.3. Sidebar (`SideNav`)

- **Platform**: Web, `layout` `medium` or `large`.
- **Route / entry point**: rendered by `<AppFrame>`.

**Component tree**

- `<SideNav items currentId expanded onToggle>` (kit: `components/navigation/Nav`) renders `<nav aria-label="Principal">`, left, full height, background `color.surface.1`, right border `color.border`, with:
  - Brand row: `<img src="/icons/icon-192.png" alt="" width="32" height="32">` (the PWA icon: pot with steam), radius 8 px; when `expanded`, the text "My Food" (800 weight) beside it. Not a link.
  - One `<a>` per item: icon (24 px) and label; height 48 px, pill radius.
  - A flexible spacer.
  - Collapse/expand `<button>` at the bottom: icon `PanelLeftClose` when `expanded`, `PanelLeftOpen` when not; `aria-expanded={expanded}`; `aria-label` "Contraer menú" when `expanded`, "Expandir menú" otherwise.

**Conditional rendering states**

- If `expanded`, width 224 px and each item and the toggle show their text label.
- If not `expanded`, width 72 px and labels are visually hidden but remain in the accessibility tree (accessible name of each link is its label; the brand text is hidden the same way). No hover-only information.
- If `item.id === currentId`: `aria-current="page"`, text and icon in `color.primary.500` on a `primary` soft tint background, icon stroke heavier.
- Otherwise: `color.text.muted`; hover shows `color.surface.2` background and `color.text`.

### 2.4. Placeholder sections (`/plan`, `/ingredients`, `/profile`)

- **Platform**: Web. **Divergence by layout**: none; the content region is the full area beside the sidebar (medium, large) or above the bottom bar (small).
- **Purpose**: reserve the section until its feature exists.
- **Route / entry point**: `src/app/plan/page.tsx`, `src/app/ingredients/page.tsx`, `src/app/profile/page.tsx` (each a route outside the `(library)` group). Each page sets its own document title: "Plan", "Despensa", "Perfil" (suffix " · My Food" as the root metadata template defines).

**Data required**: none.

**Component tree**

- `<TmpComingSoon icon={LucideIcon} title={string} />` (new), centered in the content region: a 72 px circular container (`color.surface.2`) with the icon at 32 px in `color.text.muted`; below, the title as `heading-1`; below, "Próximamente" in `color.text.muted`. No actions.
  - `/plan`: `CalendarDays`, "Plan". `/ingredients`: `Refrigerator`, "Despensa". `/profile`: `User`, "Perfil".

**Conditional rendering states**

- Always the same content (no loading, empty or error state). Works offline: the page needs no data.

### 2.5. Recipes (changed only by the frame)

- Route `/` and `/recipes/<id>` unchanged. `<AppShell>` keeps its title, sync badge and refresh control; it does not render navigation.
- In `layout === "large"` the order left to right is `<SideNav>`, the 400 px list column, the detail panel. The list column and panel widths and behavior are unchanged; the panel fills the width left after the sidebar.
- In `layout === "small"` the detail layer covers the whole window; `<BottomNav>` is not rendered while it is open (2.1).
- Navigating to another section and back, the list returns to its default state (filters and search cleared, scroll at the top).
- Pull-to-refresh behavior is unchanged and applies on Recetas only.

## 3. Navigation Map

```
Any screen ──tap destination──▶ Recetas "/" | Plan "/plan" | Despensa "/ingredients" | Perfil "/profile"
Recetas "/" ──tap row──▶ "/recipes/<id>"
    small:  detail full screen, BottomNav hidden ──close/back──▶ "/" with BottomNav
    medium: detail modal over list, SideNav visible ──close/Esc/scrim──▶ "/"
    large:  detail panel beside list, SideNav visible ──close──▶ "/"
medium/large ──tap collapse/expand──▶ SideNav collapsed ⇄ expanded (stored on the device)
unknown address ──▶ standard not-found page
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `items` | list of 4 destinations | constant in `src/lib/domain/navigation.ts` |
| `currentDestination(pathname)` | pure function → id or `null` | `src/lib/domain/navigation.ts` (unit-tested) |
| `sidebarExpanded(stored, layout)` | pure function → boolean | `src/lib/domain/navigation.ts` (unit-tested) |
| `storedExpanded` | `boolean \| null` | device-local preference, key `sidebar-expanded` |

No endpoints, no Drive access, no writes.

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `BottomNav` (registry entry changed: `items` are the four destinations above; `current` becomes `currentId`) | `components/navigation/Nav` | 2.2 |
| `SideNav` (registry entry changed: adds `expanded`, `onToggle`, brand row and collapse control) | `components/navigation/Nav` | 2.3 |
| `AppShell` (unchanged; the registry description that says it contains the navigation is wrong and must be corrected: navigation lives in `AppFrame`) | `components/layout/AppShell` | 2.5 |
| `DetailLayer` (unchanged) | `components/overlays/DetailLayer` | 2.5 |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `AppFrame` | Client frame in the root layout that holds the navigation, the sidebar preference and the layout switch | 2.1 | Formalize in the kit registry (Layout) when documented |
| `TmpComingSoon` | Centered icon, title and "Próximamente" for sections without content | 2.4 | Prototype-only name; formalize in the kit registry when documented |

## 6. Deviations from PRD (Approved)

- The prototype brand row uses the PWA icon (`/icons/icon-192.png`, pot with steam) instead of a generic icon, by the user's decision. The PRD does not specify the brand row; it adds it. Approved.

## 7. Open Items

- `docs/context/ui_standards.md` §9 still lists the old navigation ("Inicio, Recetas, Lista, Despensa", sidebar above 1024 px) and must be updated to match this feature (four destinations Recetas, Plan, Despensa, Perfil; sidebar from 640 px; bottom bar hidden in the small-window recipe detail).
- `docs/context/ui_kit_registry.md`: correct the `BottomNav` / `SideNav` and `AppShell` entries and register `AppFrame` and `TmpComingSoon`, at documentation time.
- The service worker must precache or runtime-cache the three new addresses so they open offline (PRD FR-10); verify against `public/sw.js` while implementing.
- Not covered by the prototype: the safe-area inset on an installed PWA and the not-found page; implement as specified above.
