# UX Flow: Recipe Status Filter

> Project: `my-food-manager`
> Source PRD: `011_recipe-status-filter_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/011_recipe-status-filter/index.html` (clickable; screens: Recetas, Perfil · favoritas, Plan · selector; data sets: mixed, all to-try, no status; views: automatic, phone 390 px, list column 400 px; light and dark themes)
> Status: Approved by user on 2026-11-02

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and the registry entries.

## 1. Flow Summary

One filter, Estado, is added as the seventh `FilterChip` of `RecipeFilters`. It is active on "Probadas" whenever Recetas or the Perfil favorites tab opens. The Plan's recipe picker only loses the Descartadas, with no new control.

- `SCR-recipe-list` (opens with Estado = "Probadas") → (tap chip Estado) → options panel → (choose "Por probar" or "Descartadas") → same screen, list recomputed
- `SCR-recipe-list` → (tap "x" of Estado) → same screen, no status condition, all recipes
- `SCR-recipe-list` → (tap "Limpiar" or "Quitar filtros") → same screen, every filter removed, Estado included
- `SCR-profile` (tab "Recetas favoritas", Estado = "Probadas") → same interactions over the favorites only
- `SCR-plan` → (tap "Añadir" of a slot) → `CMP-recipe-picker` listing every recipe except the Descartadas (no filter)

## 2. Screens

### 2.1. Recipe list (`SCR-recipe-list`, changed)

- **Platform**: Web, all layouts (small <640 px, medium 640–1279 px, large >=1280 px, where the list is the 400 px column). The new chip wraps with the other six; no layout divergence.
- **Purpose**: browse recipes; now separated by status.
- **Route / entry point**: `/` (unchanged). Estado is reset to "Probadas" each time the screen mounts.

**Data required**

| Field | Type | Source |
|---|---|---|
| `recipe.status` | `"to-try" \| "tried" \| "discarded"` (missing, empty or unknown → `"tried"`) | `GET /api/snapshot` via `recipeSchema`, stored library |
| `filters` | `FilterState` with the new key `status?: "tried" \| "to-try" \| "discarded"` | local state, initial value `DEFAULT_FILTER_STATE = { status: "tried" }` |
| `library.recipes.length` (M) | number | stored library, every recipe whatever its status |

**Component tree** (only what changes; the rest is as in `003`–`005`)

- `<RecipeLibrary>` (reused: `components/recipes/RecipeLibrary`) holds `filters` initialised with `DEFAULT_FILTER_STATE`
  - `<RecipeSearch>` (reused, unchanged)
  - `<RecipeFilters library={library} state={filters} onChange={setFilters} shown={shown} />` (reused: `components/recipes/RecipeFilters`; adds the seventh filter `status`, label "Estado", after Proteína)
    - `<FilterChip>` ×7 (reused: `components/inputs/FilterChip`); the Estado chip shows "Estado" with a chevron when `filters.status` is undefined, and `flabel` with an "x" (`aria-label="Quitar filtro Estado"`) when set
    - `<FilterOptions>` (reused: `components/inputs/FilterOptions`) for Estado: options `[tried: "Probadas", to-try: "Por probar", discarded: "Descartadas"]` in that order, each with its count
  - rows and groups (reused, unchanged)

**Conditional rendering states**

- If `isLoading === true` (no stored library yet), render the existing loading state (unchanged).
- If the library has no recipes, render the existing empty-library `<EmptyState>` (unchanged).
- If `filters.status === "tried"`, the list holds recipes whose status is `tried`, missing, empty or unknown.
- If `filters.status === "to-try"`, the list holds recipes with status `to-try`; if `"discarded"`, those with `discarded`.
- If `filters.status === undefined`, no status condition applies.
- If `activeFilterCount(filters) > 0 || appliedSearch`, render the count `"${shown} de ${library.recipes.length} recetas"`; otherwise `"${library.recipes.length} recetas"`. Because Estado starts active, the screen opens with the first form.
- If `activeFilterCount(filters) >= 2`, render the "Limpiar" button.
- If an Estado option has `count === 0` and is not the chosen one, render it with `disabled`. The three options always render, even when the library has none of that status.
- If the filtered list is empty (and no search applied), render `<EmptyState title="Ninguna receta coincide" hint="Prueba con otra combinación de filtros." action="Quitar filtros" />`; this includes the case where Estado alone hides everything.
- If a search is applied, render the groups Recetas / Proteína / Ingredientes computed on the recipes that pass all filters, Estado included; the option counts ignore the search.
- Otherwise, render the alphabetical list.

**Interactions / transitions**

- Tap the Estado chip → opens its `FilterOptions`; any other open panel closes; Esc or a tap outside closes it.
- Choose an option → `filters.status = value`, panel closes, list and counts recompute in place.
- Tap the "x" of Estado → `delete filters.status`, panel closes; the list shows every status.
- Tap "Limpiar" or "Quitar filtros" → `filters = {}` (Estado included); Estado does not return to "Probadas" until the screen mounts again.
- Leave Recetas and come back, or reload → `filters = DEFAULT_FILTER_STATE`, search text empty.
- A sync that updates the library → recompute list, counts and search with the current `filters`.

### 2.2. Profile, favorites tab (`SCR-profile`, changed)

- **Platform**: Web, all layouts.
- **Purpose**: list Al's favorites with the same filters.
- **Route / entry point**: `/profile`, tab "Recetas favoritas" (unchanged).

**Data required**: as 2.1 for `status`; the favorites come from `useFavorites()` (unchanged). `filters` here is independent of the one in Recetas.

**Component tree** (only what changes)

- `<ProfileScreen>` (reused: `components/profile/ProfileScreen`) holds its own `filters` initialised with `DEFAULT_FILTER_STATE`
  - `<RecipeFilters library={favLibrary} state={filters} onChange={setFilters} shown={shown} />` (reused; the Estado counts and `M` are computed over the favorites)

**Conditional rendering states**: as 2.1, with the library replaced by the favorites; the count reads `"${shown} de ${favorites.length} recetas"` while a filter is active. If the user has no favorites, render the existing empty state with "Ver recetas" (unchanged). If the favorites are non-empty but the filters hide all, render "Ninguna receta coincide" with "Quitar filtros".

**Interactions / transitions**: as 2.1. A favorite that is Descartada is hidden by default and reappears with Estado removed or on "Descartadas"; hiding it never changes `reviews/al.yaml`. Unfavoriting a row keeps the existing behaviour (the row stays dimmed until search or filters change).

### 2.3. Plan recipe picker (`CMP-recipe-picker`, changed: list only)

- **Platform**: Web, all layouts (bottom sheet below 640 px, centered modal from 640 px, unchanged).
- **Purpose**: pick one recipe for a slot, never a Descartada.
- **Route / entry point**: "Añadir" of a slot in `SCR-plan` (unchanged).

**Component tree**: unchanged (`<RecipePickerSheet>`, reused: `components/plan/RecipePickerSheet`). No filter or status control is added.

**Data required**: `recipes` passed by `PlanScreen` = `library.recipes` without those whose status is `discarded`. The plan's own lookup map (`recipeMap`) still holds every recipe so planned Descartadas stay visible.

**Conditional rendering states**

- If `recipes.length === 0` after the exclusion, render the existing `<EmptyState title="No hay recetas todavía" />`.
- If the search matches nothing, render the existing "Sin resultados" state with "Borrar búsqueda".
- Otherwise, render the list of Probadas and Por probar, searched by title.

**Interactions / transitions**: unchanged. A planned recipe that is Descartada stays in its slot and can be opened and removed as today.

## 3. Navigation Map

```
SCR-recipe-list [Estado=Probadas] ─ chip Estado ─> options ─ choose ─> SCR-recipe-list [Estado=value]
        │ "x" ─> SCR-recipe-list [no Estado]
        │ "Limpiar"/"Quitar filtros" ─> SCR-recipe-list [no filters]
        └ row ─> SCR-recipe-detail (any status, unchanged)
SCR-profile (favorites) [Estado=Probadas] ─ same interactions ─> SCR-recipe-detail
SCR-plan ─ "Añadir" ─> CMP-recipe-picker (no Descartadas) ─ "Añadir receta" ─> SCR-plan
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `recipe.status` | `"to-try" \| "tried" \| "discarded"`, default `"tried"` | `GET /api/snapshot` → `recipeSchema` (`SNAPSHOT_SCHEMA_VERSION` 3) |
| `filters.status` | `"tried" \| "to-try" \| "discarded" \| undefined` | local state per screen |
| `DEFAULT_FILTER_STATE` | `FilterState` = `{ status: "tried" }` | `src/lib/domain/filters.ts` |
| `STATUS_OPTIONS` | `[tried "Probadas", to-try "Por probar", discarded "Descartadas"]` | `src/lib/domain/filters.ts` |
| `library.recipes.length`, `favorites.length` (M) | number | stored library, `useFavorites()` |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `RecipeFilters` (adds the Estado filter) | `components/recipes/RecipeFilters` | 2.1, 2.2 |
| `FilterChip` | `components/inputs/FilterChip` | 2.1, 2.2 |
| `FilterOptions` | `components/inputs/FilterOptions` | 2.1, 2.2 |
| `RecipeLibrary` | `components/recipes/RecipeLibrary` | 2.1 |
| `ProfileScreen` | `components/profile/ProfileScreen` | 2.2 |
| `RecipePickerSheet` | `components/plan/RecipePickerSheet` | 2.3 |
| `EmptyState`, `Button`, `SearchInput` | `components/feedback/EmptyState`, `components/inputs/Button`, `components/inputs/SearchInput` | 2.1–2.3 |

**New — temporary (needs formalizing before/at ship time)**

None. The prototype's three-way toolbar (screen, data set, view) and the picker hint line are prototype-only and are not part of the app.

## 6. Deviations from PRD (Approved)

None.

## 7. Open Items

- None blocking. The registry entries of `RecipeFilters` (seventh filter, default Estado) and the library/profile behaviours are updated by document-manager at merge, not before.
