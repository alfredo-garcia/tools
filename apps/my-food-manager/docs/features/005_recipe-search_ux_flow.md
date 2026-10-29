# UX Flow: Recipe Search

> Project: `my-food-manager`
> Source PRD: `005_recipe-search_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/005_recipe-search/index.html` (clickable, sample recipes, working search and filters; views: automatic, phone 390 px, large-window column 400 px; light and dark themes)
> Status: Approved by user on 2026-10-29

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Every line resolves to a concrete rendering or data instruction. Visual values come from `ui_standards.md` tokens and are not repeated here. It changes only what differs from `003_recipe-filters_ux_flow.md` and `004_responsive-recipe-layout_ux_flow.md`; everything not mentioned stays as specified there.

## 1. Flow Summary

The recipe list gets a search bar between the "Recetas" title and the filters. Typing 3 or more characters and pausing for 1 second replaces the plain list with results grouped by where the text was found. The filters keep working on their own.

- `SCR-library-list` (plain list) → (user types 3+ characters and stops for 1 s, or presses Enter) → `SCR-library-list` (grouped results) → (tap "x", press Esc, or delete letters until fewer than 3 remain) → `SCR-library-list` (plain list)
- `SCR-library-list` (grouped results) → (nothing matches) → empty state → (tap "Borrar búsqueda" and/or "Quitar filtros") → previous list
- Any list state → (tap a row) → `SCR-recipe-detail` as in features 002 and 004

## 2. Screens

### 2.1. Recipe list (only screen changed)

- **Platform**: Web. **Divergence by layout**: none; in `layout === "large"` the bar is inside the 400 px left column and scrolls with it; in `small` and `medium` it is inside the centered `<AppShell>` content.
- **Purpose**: the existing list with filters, now searchable.
- **Route / entry point**: `/` and every `/recipes/<id>` address (unchanged).

**Data required**

| Field | Type | Source |
|---|---|---|
| `library.recipes` | `Recipe[]` (`title`, `tags.protein`, `ingredients[].ing`) | `useLibrary()` |
| `library.ingredients` | `Record<id, { name }>` | `useLibrary()` |
| `library.vocab.tags.protein.values` | `Record<id, label>` | `useLibrary()` |
| `filters` | `FilterState` | page state (feature 003) |
| `typed` | string, raw text of the bar | page state, starts `""`, never persisted |
| `applied` | string, trimmed text in effect | page state, starts `""`, never persisted |
| `groups` | `{ key: "recipes" \| "protein" \| "ingredients"; label: string; recipes: Recipe[] }[]` | domain function over `library`, `applied`, `filters` |
| `shown` | number, distinct recipes across `groups`, or the filtered recipes when `applied === ""` | derived |

**Component tree**

- `<AppShell title="Recetas">` (kit: `components/layout/AppShell`)
  - `<SearchInput value={typed} onChange={setTyped} onClear={clear} onSubmit={applyNow} placeholder="Buscar por nombre, proteína o ingrediente" />` (kit: `components/inputs/SearchInput`, registry Beta, **extended** with `onClear`, `onSubmit` and the clear button; wrapped in an element with `role="search"`; accessible name "Buscar recetas")
  - `<RecipeFilters library={library} state={filters} onChange={setFilters} shown={shown} />` (kit: `components/recipes/RecipeFilters`, unchanged; its count line reads "N de M recetas" when `applied !== ""` or any filter is active)
  - Results region, one of:
    - plain list: `<ul>` of `<RecipeLink>` rows with `<RecipePhoto>` (unchanged, as in 003/004)
    - grouped results: for each item of `groups`, `<TmpResultGroup label={label} count={recipes.length}>` containing the same `<ul>` of rows
    - `<EmptyState>` (kit: `components/feedback/EmptyState`)

**Conditional rendering states**

- If `typed.trim().length < 3`, `applied` is `""` and the plain list renders (no message), filtered by `filters` only.
- If `applied !== ""` and `groups.length > 0`, render one `<TmpResultGroup>` per group in this order, skipping groups with no recipes: `recipes` ("Recetas"), `protein` ("Proteína"), `ingredients` ("Ingredientes").
- If `applied !== ""` and `groups.length === 0`, render `<EmptyState emoji="🔎" title="Ninguna receta coincide" hint={hint} action={actions} />` where:
  - `hint` is "Prueba con otro texto o quita filtros." if any filter is active, otherwise "Prueba con otro texto."
  - `actions` is a `<Button>` "Borrar búsqueda" (primary) and, if any filter is active, a `<Button>` "Quitar filtros" (secondary).
- If `applied === ""` and the filters match nothing, render the 003 empty state unchanged ("Ninguna receta coincide", hint "Prueba con otra combinación de filtros.", `<Button>` "Quitar filtros").
- If `typed` is non-empty, the clear button is visible; if `typed === ""`, it is hidden (not just invisible).
- If a debounce is pending (`typed.trim() !== applied` and `typed.trim().length >= 3`), keep rendering the previous results; render no spinner and no other indicator.
- If `layout === "large"` and `selectedRecipeId` is defined, every row for that recipe in every group renders the selected style and `aria-current="true"`.
- If the library is loading, empty or failed to load, render the existing states of 001/003 and do not render `<SearchInput>`.
- If a sync replaces `library`, recompute `groups` and `shown` in place with the same `applied` and `filters`; `typed` and focus are unchanged.
- If `prefers-reduced-motion` is set, no list animation; otherwise rows animate as in 003 with the key `<groupKey>:<recipe.id>`.
- The count line is announced to screen readers politely whenever `shown` changes.

**Group heading**

- `<TmpResultGroup>` renders a `<section>` with an `<h2>` reading `<label> · <count>` (label as in the order above, count is the number of rows in that group), then the `<ul>` of rows. Rows are alphabetical (Spanish collation), as in the plain list.

**Interactions / transitions**

- Type in the bar → `typed` updates and the clear button shows; any pending timer is cancelled and a new 1000 ms timer starts; when it fires, `applied` = `typed.trim()` if its length is >= 3, otherwise `""`.
- Press Enter in the bar → cancels the timer and sets `applied` at once by the same rule. No form submission and no navigation.
- Press Esc in the bar with text → same as tapping the clear button. With no text it does nothing.
- Tap the clear button → `typed = ""`, `applied = ""` at once (no wait), the plain list renders, focus moves to the bar. `filters` are unchanged.
- Tap a filter, an option, a filter's "x", "Limpiar" or "Quitar filtros" → `filters` change as in 003; `typed` and `applied` are unchanged.
- Tap "Borrar búsqueda" in the empty state → same as the clear button.
- Tap a row in any group → opens the detail as in 002/004; the search text and the list scroll position are kept while the detail is open.
- Paste text → handled as typing.

**Text matching (reference for the domain function)**

- Normalize with lowercase and removal of combining accents; `ñ` stays `ñ`. Split `applied` into words on whitespace.
- A recipe is in `recipes` if every word is found in `title`; in `protein` if every word is found in one single label (or id) of `tags.protein`; in `ingredients` if every word is found in the name of one single ingredient line (catalog `name`, or the id with hyphens as spaces when missing). A word matches a part of a value.
- `groups` is computed after applying `filters`. A recipe appears in every group it matches.

## 3. Navigation Map

```
SCR-library-list ──type 3+ chars + 1 s / Enter──▶ grouped results ──"x" / Esc / <3 chars──▶ plain list
        │                                              │
        │                                              └─no match─▶ empty state ──Borrar búsqueda / Quitar filtros──▶ previous list
        └──tap row (plain or grouped)──▶ SCR-recipe-detail (002/004) ──back/close──▶ SCR-library-list (text and filters kept)
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `library.recipes[].title` | string | `useLibrary()` |
| `library.recipes[].tags.protein` | string[] (ids) | `useLibrary()` |
| `library.vocab.tags.protein.values` | Record<id, label> | `useLibrary()` |
| `library.recipes[].ingredients[].ing` | string (id) | `useLibrary()` |
| `library.ingredients[id].name` | string | `useLibrary()` |
| `typed`, `applied` | string | page state, not persisted |
| `filters` | `FilterState` | page state (003) |

No new endpoints and no writes.

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `AppShell` | `components/layout/AppShell` | 2.1 |
| `SearchInput` (extended: clear button, `onClear`, `onSubmit`) | `components/inputs/SearchInput` | 2.1 |
| `RecipeFilters` | `components/recipes/RecipeFilters` | 2.1 |
| `RecipeLink` | `components/recipes/RecipeLink` | 2.1 |
| `RecipePhoto` | `components/recipes/RecipePhoto` | 2.1 |
| `EmptyState` | `components/feedback/EmptyState` | 2.1 |
| `Button` | `components/inputs/Button` | 2.1 |
| `useListReorder` | `components/recipes/use-list-reorder` | 2.1 |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `TmpResultGroup` | Group heading `<label> · <count>` with the list of rows under it | 2.1 | Prototype-only name; formalize in the kit registry when the feature is documented. `SearchInput` is not implemented in code yet: it is built here from its registry entry. |

## 6. Deviations from PRD (Approved)

None.

## 7. Open Items

- None blocking. The selected-row highlight for the open recipe on every group row (large windows) follows the PRD but is not shown in the prototype, which has no detail panel; implement as specified in 2.1.
