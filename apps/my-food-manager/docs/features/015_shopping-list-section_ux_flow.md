# UX Flow: Shopping List Section

> Project: `my-food-manager`
> Source PRD: `015_shopping-list-section_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/015_shopping-list-section/index.html` (clickable; phone frame and desktop with sidebar, light and dark themes, Compra with badge and Compartir, simulated share menu and clipboard fallback, Despensa without tabs, recipe rows with the aligned rating, recipe detail with the small-window collapsed sections)
> Status: Approved by user on 2026-11-03

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and the registry entries.

## 1. Flow Summary

The shopping list becomes the main-navigation section Compra (`/shopping-list`), with a count badge and "Compartir". Despensa (`/ingredients`) loses its tabs. The recipe detail opens Info general and Notas collapsed on small windows. The row rating is centered on the category line.

- Any screen → (tap Compra) → `SCR-shopping-list`
- `SCR-shopping-list` → (tap "Compartir") → device share menu → `SCR-shopping-list`; without a share menu → clipboard + toast "Lista copiada"
- `SCR-shopping-list` (empty) → (tap "Ir a Despensa") → `SCR-ingredients`
- Any screen → (tap Despensa) → `SCR-ingredients` with Estado "Todos"
- `SCR-library-list` → (tap a row, small window) → `SCR-recipe-detail` with Info general and Notas collapsed

## 2. Screens

### 2.1. Main navigation (`CMP-main-navigation`, changed)

- **Platform**: Web. `BottomNav` below 640 px, `SideNav` from 640 px, as today.
- **Purpose**: reach Compra in one tap and see how many ingredients are to buy.

**Data required**

| Field | Type | Source |
|---|---|---|
| `DESTINATIONS` | `{ id, href, label }[]`: recipes `/` Recetas, plan `/plan` Plan, shopping `/shopping-list` Compra, ingredients `/ingredients` Despensa, profile `/profile` Perfil | `src/lib/domain/navigation.ts` |
| `buyCount` | number | `buyCount(catalogItems(library.ingredients), pantryWithPending(library.pantry, outbox.pending))`; 0 while there is no library |

**Component tree** (only what changes)

- `<BottomNav items currentId badges>` / `<SideNav … badges>` (reused: `components/navigation/Nav`), new prop `badges?: Partial<Record<DestinationId, number>>`
  - icon map gains `shopping: ShoppingCart`
  - each item's icon is wrapped in `<span className="relative inline-flex">` with `<TmpNavBadge count={badges[id]} />` (**NEW**, see §5) when the count is > 0
  - item `aria-label="Compra, N por comprar"` when the Compra count is > 0; otherwise no `aria-label` (the visible label names it)
- `<TmpNavBadge count>` renders `<span aria-hidden>` with classes `absolute -top-1.5 left-3.5 min-w-[18px] h-[18px] px-[5px] rounded-full bg-primary-500 text-primary-contrast text-[11px] font-extrabold leading-[18px] text-center ring-2 ring-surface-1`; text `count > 99 ? "99+" : count`

**Conditional rendering states**

- If `count === 0` or the library is not loaded, render no badge.
- Collapsed `SideNav`: the badge stays on the icon; the label stays `sr-only`.

### 2.2. Compra (`SCR-shopping-list`, NEW route)

- **Platform**: Web.
- **Route**: `/shopping-list`, metadata title "Lista de compra" (tab "Lista de compra · My Food").
- **Purpose**: the shopping list, with sharing.

**Data required**

| Field | Type | Source |
|---|---|---|
| list rows | `IngredientItem[]` | `baseList(items, view, { tab: "lista", … })`, as the old tab |
| `shareText` | string | `shoppingListText(items, view.buy, vocab)` (**NEW** pure function in `src/lib/domain`, PRD §7) |

**Component tree**

- `<AppShell title="Lista de compra">` (reused)
  - `<div className="flex items-center gap-2">`: `<SearchInput placeholder="Buscar ingrediente" …/>` (in a `flex-1 min-w-0` wrapper) and, when `buyCount > 0`, `<ShareButton label="Compartir" recipeTitle=… onShare busy />` (reused: `components/recipes/ShareButton`, generalized: prop `recipeTitle` renamed to `subject`, see §5)
  - `<FilterChip label="Familia">` + `<FilterOptions>` (reused), as today
  - `<TmpPendingChanges>` (reused), as today
  - `<ul>` of `<IngredientRow tab="lista" …/>` (reused), as today
  - `<EmptyState emoji="🛒" title="Tu lista está vacía" hint="Activa Comprar en un ingrediente de Despensa." action={<Button href or onClick → /ingredients>Ir a Despensa</Button>} />`
  - `<KeyDialog>`, `<Toast>` as today; toast for share notices

**Conditional rendering states**

- If loading / no library offline / error: same `EmptyState`s as Despensa.
- If `buyCount === 0` (live count, struck rows excluded), render no `ShareButton`.
- If no rows and no search/filter and no struck rows: the empty state above; otherwise "Ningún ingrediente coincide" as today.

**Interactions / transitions**

- Tap "Compartir" with `navigator.share` → `navigator.share({ text: shareText })`; `AbortError` → nothing; other error → toast "No se pudo compartir".
- Tap "Compartir" without `navigator.share` → `navigator.clipboard.writeText(shareText)`; success → toast "Lista copiada"; failure → "No se pudo copiar la lista". Toasts last 4 s.
- While a share is in progress, the button is `busy` (disabled).
- Turning "Comprar" off leaves the row struck through until leaving `/shopping-list`.

### 2.3. Despensa (`SCR-ingredients`, changed)

- **Route**: `/ingredients`, as today.
- **Component tree**: `<AppShell title="Despensa">` with `<SearchInput>`, family `<FilterChip>`, `<TmpSegmentedControl kind="radio" ariaLabel="Estado" items={[todos "Todos", tengo "Tengo", notengo "No tengo"]} value default "todos">`, rows `<IngredientRow tab="despensa">`. No tabs `TmpSegmentedControl`.
- Behaviour otherwise as today (kept rows, staples, pending, key, toasts).

### 2.4. Recipe detail (`SCR-recipe-detail`, changed)

- `<CollapsibleSection title defaultOpen>` (reused: `components/recipes/detail/CollapsibleSection`), new prop `defaultOpen?: boolean` (default `true`).
- `InfoSection` and `NotesSection` pass `defaultOpen={layout !== "small"}` with the layout read when the recipe opens; sections remount per recipe (key by recipe id), so each new recipe starts again from the default.
- Ingredientes and Pasos: unchanged (open).

### 2.5. Recipe rows (`RatingMark`, changed)

- The category line `<div className="text-xs text-text-muted">` becomes `flex items-center`, so `RatingMark` (`inline-flex items-center`) and the separator "·" are centered on the text line. Applies wherever `RecipeRow` shows a rating (Recetas, Perfil favorites) and in the Plan rows using `RatingMark`, with the same rule there.

## 3. Navigation Map

```
any screen ──Compra──▶ SCR-shopping-list ──Compartir──▶ share menu | clipboard+toast
                           └─ empty: "Ir a Despensa" ──▶ SCR-ingredients
any screen ──Despensa──▶ SCR-ingredients (Estado: Todos)
SCR-library-list ──row──▶ SCR-recipe-detail (small: Info general, Notas collapsed)
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| pantry with pending | `{ have, buy }` | `pantryWithPending` |
| `buyCount` | number | `buyCount` in `pantry-view.ts` |
| shared text | string | new `shoppingListText` (domain) |
| families vocabulary | map | `library.vocab.families` |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `BottomNav`, `SideNav` (new prop `badges`) | `components/navigation/Nav` | 2.1 |
| `AppShell` | `components/layout/AppShell` | 2.2, 2.3 |
| `SearchInput`, `FilterChip`, `FilterOptions`, `Button` | `components/inputs/*` | 2.2, 2.3 |
| `TmpSegmentedControl` | `components/inputs/TmpSegmentedControl` | 2.3 |
| `IngredientRow`, `KeyDialog` | `components/pantry/*` | 2.2, 2.3 |
| `ShareButton` (prop `recipeTitle` → `subject`) | `components/recipes/ShareButton` | 2.2, recipe detail |
| `EmptyState`, `Toast`, `TmpPendingChanges` | `components/feedback/*` | 2.2, 2.3 |
| `CollapsibleSection` (new prop `defaultOpen`) | `components/recipes/detail/CollapsibleSection` | 2.4 |
| `RecipeRow`, `RatingMark` | `components/recipes/*` | 2.5 |

**New (add to `ui_kit_registry.md` when the feature ships)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `TmpNavBadge` | Count over a navigation icon | 2.1 | `components/navigation/TmpNavBadge`; `99+` cap; `aria-hidden`, the count goes in the item's name |

## 6. Deviations from PRD (Approved)

None. The screen title "Lista de compra" wraps to two lines next to the sync badge on phones; the user approved it with the prototype.

## 7. Open Items

None.
