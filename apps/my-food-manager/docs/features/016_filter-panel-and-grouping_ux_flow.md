# UX Flow: Filter Panel and Family Grouping

> Project: `my-food-manager`
> Source PRD: `016_filter-panel-and-grouping_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/016_filter-panel-and-grouping/index.html` (clickable, code-first; phone frame and desktop with sidebar, light and dark themes; Recetas and Perfil with the filter icon and the Favoritos filter, Compra with Tengo + Comprar and the automatic Tengo, Compra and Despensa with the family filter and "Agrupar por familia")
> Status: Approved by user on 2026-11-12

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and the registry entries.

## 1. Flow Summary

Recetas, Perfil, Compra and Despensa open with their filters hidden behind a filter icon at the right of the search. Recetas and Perfil have no default filter; Recetas gains "Favoritos". Compra rows get "Tengo", and turning "Comprar" off there turns "Tengo" on. Compra and Despensa can group rows by family.

- Any list screen → (tap filter icon) → same screen with the panel shown → (tap again) → panel hidden
- `SCR-library-list` → (panel, Favoritos → "Favoritos") → list of favorites, icon shows "1"
- `SCR-shopping-list` → (turn "Comprar" off) → row struck, "Tengo" on → (turn "Comprar" on) → row normal, "Tengo" back to off
- `SCR-shopping-list` / `SCR-ingredients` → (panel, "Agrupar por familia" on) → rows under family headings
- Leaving any of these screens or reloading → panel hidden, filters, grouping and search reset

## 2. Screens

### 2.1. Shared: search row and `TmpFilterToggle` (NEW)

- **Platform**: Web, all layouts.
- **Component tree**
  - `<div className="flex items-center gap-2">`
    - `<SearchInput …/>` (reused) in a `flex-1 min-w-0` wrapper
    - (Compra only, when `buyCount > 0`) `<ShareButton …/>` (reused, see 2.4)
    - `<TmpFilterToggle expanded={panelOpen} count={activeCount} onToggle={() => setPanelOpen(o => !o)} />` (**NEW**)
- `TmpFilterToggle` renders `<button type="button" aria-expanded={expanded} aria-label={count > 0 ? \`Filtros, ${count} ${count === 1 ? "activo" : "activos"}\` : "Filtros"}>` 48×48 px, `rounded-full border border-border bg-surface-1`, icon `SlidersHorizontal` (lucide-react, 20 px). When `expanded`: `border-primary-500 bg-primary-500/15 text-primary-500`. When `count > 0`: a count pill with the `TmpNavBadge` look (`bg-primary-500 text-primary-contrast text-[11px] font-extrabold`, `ring-2 ring-surface-1`, `aria-hidden`), positioned `-top-1 -right-1`.
- **State**: `panelOpen` is component state, initial `false`; never persisted. Remounting the screen (navigation, reload) resets it.

### 2.2. Recetas (`SCR-library-list`, changed) and Perfil favorites (`SCR-profile`, changed)

**Data required**

| Field | Type | Source |
|---|---|---|
| initial filters | `FilterState` | `{}` (no default; `DEFAULT_FILTER_STATE` becomes `{}`) |
| favorites | `ReadonlySet<string>` | Al's favorites with pending changes applied (as the hearts) |
| `activeCount` | number | number of keys set in the filter state |

**Component tree** (only what changes)

- `RecipeLibrary`: search row of 2.1 with `count = activeCount`; `<RecipeFilters library state onChange shown searching expanded={panelOpen} favorites={favorites} />`.
- `ProfileScreen`: same, without `favorites` (so no Favoritos filter).
- `RecipeFilters` (reused, changed):
  - new prop `expanded: boolean`: if `expanded=false`, render no chip row and no option panel; the count line ("N recetas" / "N de M recetas") and "Limpiar" render in both cases, with their current rules.
  - new prop `favorites?: ReadonlySet<string>`: when present, a ninth `FilterChip` "Favoritos" after Rating with fixed options `yes` "Favoritos" and `no` "No favoritos", counts given the other active filters, disabled at 0 unless chosen. When absent, the chip is not rendered.
  - Hiding the panel with an option list open closes the list.
- Heart taps with Favoritos active: the visible rows are frozen (kept in place and in the list) until the filter state or the applied search changes (PRD FR-3).

**Conditional rendering states**

- If `activeCount === 0` and no search applied: count line "N recetas"; icon without count.
- If `activeCount >= 1`: count line "N de M recetas" visible with the panel shown or hidden; if `activeCount >= 2`, "Limpiar" too.
- No results: existing `EmptyState` with "Quitar filtros" (clears all, Favoritos included).

### 2.3. Despensa (`SCR-ingredients`, changed)

**Component tree**

- `<AppShell title="Despensa">`
  - search row of 2.1 with `count = family ? 1 : 0`
  - if `panelOpen`: `<FilterChip label="Familia">` + `<FilterOptions>` (reused, as today), then a `<div className="flex min-h-12 items-center justify-between">` row: label "Agrupar por familia" and `<TmpSwitch tone="primary" checked={grouped} ariaLabel="Agrupar por familia" onChange>` (reused)
  - `<TmpSegmentedControl kind="radio" ariaLabel="Estado" items={todos, tengo, notengo}>`, always rendered, outside the panel, as today
  - `<TmpPendingChanges>` as today
  - rows: if `grouped=false`, `<ul>` of `<IngredientRow tab="despensa">` as today; if `grouped=true`, one `<TmpResultGroup label={familyLabel} count={n}>` (reused) per family, each with its `<ul>` of rows

### 2.4. Compra (`SCR-shopping-list`, changed)

**Component tree**

- `<AppShell title="Lista de compra">`
  - search row of 2.1 with `count = family ? 1 : 0`; `ShareButton` when `buyCount > 0`:
    - If `layout === "small"`: icon-only, 48×48 round, same look as `TmpFilterToggle` idle, `aria-label="Compartir"`.
    - Else: icon + "Compartir", as today.
  - if `panelOpen`: family `FilterChip` + `FilterOptions` and the "Agrupar por familia" row, as 2.3
  - rows: `<IngredientRow tab="lista">` now renders both switches, "Tengo" (`tone="success"`) and "Comprar" (`tone="primary"`), like Despensa; struck rows keep both switches; grouped as 2.3

**Interactions**

- Flip "Comprar" off on row `id` with `have=false`: enqueue `pantry.setBuy(id, false)` then `pantry.setHave(id, true)`; add `id` to `struck` and to `autoHave`.
- Flip "Comprar" off with `have=true`: enqueue `pantry.setBuy(id, false)` only; add `id` to `struck`.
- Flip "Comprar" on for a struck `id` in `autoHave`: enqueue `pantry.setBuy(id, true)` then `pantry.setHave(id, false)`; remove from `struck` and `autoHave`.
- Flip "Comprar" on for a struck `id` not in `autoHave`: enqueue `pantry.setBuy(id, true)` only.
- Flip "Tengo" on any row: enqueue `pantry.setHave`; remove `id` from `autoHave`; `struck` unchanged; "Comprar" unchanged.
- `struck` and `autoHave` are component state, reset on leaving Compra.

### 2.5. Grouping (Compra and Despensa)

- Group order: `familyOptions` order (vocabulary), unknown families after them alphabetically, "Otros" (no family) last; same order as `shoppingListText` (feature 015). Rows alphabetical (Spanish) inside each group.
- Groups are computed on the rows that remain after search, family filter and (Despensa) Estado; empty groups are not rendered.
- `TmpResultGroup` heading: "<Family label> · <count>".
- Grouping is not counted by `TmpFilterToggle`, and "Quitar filtros" does not turn it off.

## 3. Navigation Map

```
SCR-library-list / SCR-profile ──filter icon──▶ panel (9 / 8 filters) ──Favoritos──▶ favorites only
SCR-shopping-list ──Comprar off──▶ struck + Tengo on ──Comprar on──▶ restored
SCR-shopping-list / SCR-ingredients ──filter icon──▶ panel (Familia, Agrupar por familia)
any of them ──leave or reload──▶ panel hidden, state reset
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| filter state | `FilterState` (new key `fav`) | `src/lib/domain/filters.ts`, initial `{}` |
| favorites | set of recipe ids | reviews with pending changes |
| pantry with pending | `{ have, buy }` | `pantryWithPending` |
| family order | `familyOptions` | `pantry-view.ts` |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `SearchInput`, `FilterChip`, `FilterOptions` | `components/inputs/*` | 2.2, 2.3, 2.4 |
| `RecipeFilters` (new props `expanded`, `favorites`) | `components/recipes/RecipeFilters` | 2.2 |
| `RecipeLibrary`, `RecipeRow`, `FavoriteButton` | `components/recipes/*` | 2.2 |
| `TmpSwitch` | `components/inputs/TmpSwitch` | 2.3, 2.4 |
| `TmpSegmentedControl` | `components/inputs/TmpSegmentedControl` | 2.3 |
| `TmpResultGroup` | `components/recipes/TmpResultGroup` | 2.3, 2.4 |
| `IngredientRow` (both switches on `tab="lista"`) | `components/pantry/IngredientRow` | 2.3, 2.4 |
| `ShareButton` (icon-only on small windows in Compra) | `components/recipes/ShareButton` | 2.4 |
| `AppShell`, `TmpPendingChanges`, `EmptyState`, `Toast` | `components/*` | all |

**New (add to `ui_kit_registry.md` when the feature ships)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `TmpFilterToggle` | Show/hide the filter panel and show the active count | 2.1 | `components/inputs/TmpFilterToggle`; `SlidersHorizontal`; count pill styled as `TmpNavBadge` |

The "Agrupar por familia" row is a label plus the existing `TmpSwitch`, not a new component.

## 6. Deviations from PRD (Approved)

- In Compra on small windows (under 640 px), "Compartir" is an icon-only button named "Compartir"; with the filter icon beside it, the labelled button left the search too narrow. On medium and large windows it keeps icon and text. This changes the 015 rule "Compartir next to the search, with the `Share2` icon and the text". Approved by the user on 2026-11-12.

## 7. Open Items

None.
