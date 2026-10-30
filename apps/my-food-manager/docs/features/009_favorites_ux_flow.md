# UX Flow: Favorites

> Project: `my-food-manager`
> Source PRD: `009_favorites_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/009_favorites/index.html` (clickable; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; toolbar to simulate connection, stored key, a rejected change, and empty favorites)
> Status: Approved by user on 2026-10-30

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and are not repeated here. The app frame and navigation stay as in the `006` UX Flow; the pending-changes indicator, the write key dialog and the outbox behave as in the `007` UX Flow; the recipe list, search, filters and detail stay as in `002`–`005`, with the changes below. Copy is Spanish.

## 1. Flow Summary

Favorites add one control, the heart, to three places: each recipe row (Recetas and Perfil), and the recipe detail. Perfil gets a tab bar with one tab, "Recetas favoritas", that lists only favorites.

- `SCR-recipe-list` → (tap heart on a row) → same screen, heart toggled, change saved or pending
- `SCR-recipe-list` → (tap row) → `SCR-recipe-detail` → (tap heart / "Añadir a favoritos" / "Quitar de favoritos") → same detail and the row behind it update
- `SCR-profile` (tab "Recetas favoritas") → (tap heart on a row) → row stays dimmed with outline heart until the view changes
- `SCR-profile` → (tap row) → `SCR-recipe-detail` over Perfil (modal on medium and large, full screen on small) → close → `SCR-profile` unchanged
- `SCR-profile` (no favorites) → (tap "Ver recetas") → `SCR-recipe-list`
- Any toggle with no stored key → `KeyDialog` → pending changes sent

## 2. Screens

### 2.1. Recipe list (`SCR-recipe-list`, changed)

- **Platform**: Web, all layouts (small <640 px, medium 640–1279 px, large >=1280 px). Large keeps the 400 px list column with the detail panel beside it.
- **Purpose**: browse recipes and mark favorites.
- **Route / entry point**: `/` (unchanged).

**Data required**

| Field | Type | Source |
|---|---|---|
| `favorites` | `Set<string>` | `useFavorites()`: `library.reviews.al.favorites` with pending `review.setFavorite` operations applied (pure `favoritesWithPending`) |
| `canWrite` | boolean | `useFavorites()`: `library.reviews.al` exists |
| `pending`, `keyStored` | as in `007` | outbox |

**Component tree** (only what changes; the rest is as in `002`–`005`)

- `<RecipeLibrary>` (kit: `components/recipes/RecipeLibrary`)
  - If `pending.length > 0`: `<TmpPendingChanges count={pending.length} keyNeeded={!keyStored} onEnterKey={openKeyDialog} />` (reused) above the list
  - For each recipe: `<RecipeRow recipe={r} current={r.id === detailId} replace={large && detailId !== undefined} favorite={favorites.has(r.id)} onToggleFavorite={() => toggle(r.id)} />` (**NEW**, extracted from the existing row markup, `components/recipes/RecipeRow`)
    - `<RecipeLink>` (reused) with `<RecipePhoto>` (reused), title (truncated) and category
    - `<FavoriteButton pressed={favorite} onToggle={...} label={null} recipeTitle={r.title} />` (**NEW**, see 2.4), a sibling of the link (never inside the anchor), at the right edge
  - `<KeyDialog>` (reused, `components/pantry/KeyDialog`) when `keyDialogOpen`
  - `<Toast>` (reused) when `notice !== null`

**Conditional rendering states**

- If `favorites.has(r.id) === true`, render the row's heart with `pressed`
- If `canWrite === false`, `onToggle` shows `<Toast message={"No se pudo guardar " + r.title} />` and enqueues nothing
- All other states (loading, no library, no recipes, no results) as today.

**Interactions / transitions**

- Tap heart → `outbox.enqueueFavorite(r.id, !favorite, storedValue)` → the heart flips at once; the row does not open and the list does not reorder.
- If `!keyStored` on a toggle → open `<KeyDialog>`; "Ahora no" leaves changes pending (indicator offers "Introducir clave").
- Server rejects the operation → heart returns to the stored value and `<Toast message={"No se pudo guardar " + r.title} />`.

### 2.2. Recipe detail (`SCR-recipe-detail`, changed)

- **Platform**: Web. **Divergence by detail mode**: `fullscreen` (small), `modal` (medium, and any layout when opened over Plan or Perfil), `panel` (large, beside the Recetas list).
- **Purpose**: read the recipe and mark it as favorite.
- **Route / entry point**: `/recipes/<id>`, or opened with `onClose` over Plan or Perfil (unchanged).

**Data required**: the recipe and library as in `002`; `favorites`, `toggle` from `useFavorites()`.

**Component tree** (`RecipeContent`, only what changes)

- If `mode === "fullscreen"`: title row `<div className="flex items-start gap-2">` with `<h1 data-detail-title>` (flex, min-width 0, wraps) and `<FavoriteButton pressed={isFav} onToggle={...} recipeTitle={recipe.title} />` at the right.
- If `mode === "modal"` or `mode === "panel"`: the `<h1>` stays hidden as today (the layer bar shows the title); under `<RecipePhoto>` render `<FavoriteButton pressed={isFav} onToggle={...} label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"} recipeTitle={recipe.title} />` inside a wrapper with the photo.
  - In `panel` mode the photo and the button are one element in grid column 1, row 1 (2fr), beside "Info general" (3fr, column 2, row 1); the other sections span below.
  - In `modal` mode the button sits under the photo, left aligned, with the width of its content.

**Conditional rendering states**

- If `recipe === undefined`, render the existing "Receta no encontrada" state with no heart.
- If `canWrite === false`, `onToggle` shows the rejection toast and enqueues nothing.
- Otherwise, the tree above.

**Interactions / transitions**

- Tap heart or button → same enqueue as 2.1; the control and the row behind update at once. Focus stays on the control.
- Resize across breakpoints with the detail open → the control moves between placements keeping its state.

### 2.3. Perfil (`SCR-profile`, replaces the placeholder)

- **Platform**: Web, all layouts (single column; no list/detail split on large).
- **Purpose**: see and manage Al's favorite recipes.
- **Route / entry point**: `/profile` (Perfil in the main navigation). Browser tab title "Perfil · My Food".

**Data required**

| Field | Type | Source |
|---|---|---|
| `library` | `Library` | `useLibrary()` |
| `favorites`, `toggle`, `canWrite` | as in 2.1 | `useFavorites()` |
| `filters` | `FilterState` | local state, emptied on leaving or reload |
| `typed`, `applied` | string | `useSearchQuery()` |
| `kept` | `Set<string>` | local state: ids unfavorited while shown; cleared when search, filters or tab change |
| `openRecipeId` | string \| null | local state |

**Component tree**

- `<ProfileScreen>` (**NEW**, `components/profile/ProfileScreen`, rendered by `src/app/profile/page.tsx` in place of `<TmpComingSoon>`)
  - `<AppShell title="Perfil">` (reused)
    - `<TmpSegmentedControl kind="tabs" ariaLabel="Perfil" items={[{ value: "favoritas", label: "Recetas favoritas" }]} value="favoritas" onChange={noop} />` (reused)
    - `<SearchInput placeholder="Buscar en tus favoritas" label="Buscar recetas" />` (reused)
    - `<RecipeFilters library={favoritesLibrary} state={filters} onChange={...} shown={shown} searching={searching} />` (reused; `favoritesLibrary` is the library with `recipes` limited to favorites plus `kept`)
    - `<TmpPendingChanges>` when `pending.length > 0`
    - List: `<RecipeRow ... dimmed={!favorites.has(r.id)} onOpen={() => setOpenRecipeId(r.id)} />` for each recipe in library order
  - If `openRecipeId !== null`: `<RecipeDetail id={openRecipeId} overlay onClose={() => setOpenRecipeId(null)} />` (reused, as the Plan does)
  - `<KeyDialog>`, `<Toast>` as in 2.1

**Conditional rendering states**

- If `!hydrated || (!library && status === "syncing")`, render `<EmptyState emoji="🍳" title="Cargando tus recetas…" />`
- If `!library`, render the offline / error `<EmptyState>` of Recetas with "Reintentar"
- If no recipe is a favorite and none is `kept`, render `<EmptyState emoji="💚" title="Aún no tienes favoritas" hint="Toca el corazón de una receta para guardarla aquí." action={<Button onClick={goToRecipes}>Ver recetas</Button>} />`
- If favorites exist but search and filters match none, render `<EmptyState emoji="🔎" title="Ninguna receta coincide" ... />` with "Borrar búsqueda" and "Quitar filtros" as in Recetas
- If `favorites.has(r.id) === false` and `kept.has(r.id)`, render the row dimmed with an outline heart
- Otherwise, the normal tree.

**Interactions / transitions**

- Tap heart on a row → toggle; when turning off, add the id to `kept` so the row stays dimmed; tap again restores it.
- Tap a row → `openRecipeId` set → detail opens over Perfil without changing the address; close, Esc or backdrop → `openRecipeId = null`, Perfil as it was.
- Tap "Ver recetas" → navigates to `/`.
- Change search or filters, or leave Perfil → `kept` is cleared.

### 2.4. FavoriteButton (component)

- **Props**: `pressed: boolean`, `onToggle: () => void`, `recipeTitle: string`, `label?: string` (when present, the button shows the heart and the text; otherwise heart only).
- **Rendering**: `<button type="button" aria-pressed={pressed} aria-label={label ? undefined : (pressed ? "Quitar de favoritos" : "Añadir a favoritos") + ": " + recipeTitle}>` with the lucide `Heart` icon, filled when `pressed`; hit area at least 44 px; `pressed` uses the `color.accent.lime` token. The labeled variant has the width of its content.
- `onClick` stops propagation.

## 3. Navigation Map

```
Recetas (/) ──tap row──> Detalle (/recipes/<id>) ──close──> Recetas
   │  heart on row / detail ──> toggle ──> outbox ──> Drive
Perfil (/profile) ──tap row──> Detalle (overlay, no address change) ──close──> Perfil
   │  empty ──"Ver recetas"──> Recetas
Any toggle without key ──> KeyDialog ──save──> pending changes sent
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `library.reviews.al.favorites` | `string[]` | `GET /api/snapshot` (stored) |
| `pending[].{id,kind:"review.setFavorite",recipe,value}` | operation | outbox (IndexedDB) |
| `favorites` | `Set<string>` | stored with pending applied |
| `canWrite` | boolean | `library.reviews.al !== undefined` |
| `keyStored` | boolean | device preference (as `007`) |
| Operation sent | `{ id, kind: "review.setFavorite", recipe, value }` | `POST /api/ops` |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `RecipeLink`, `RecipePhoto` | `components/recipes/RecipeLink`, `components/recipes/RecipePhoto` | 2.1, 2.3 |
| `RecipeFilters`, `SearchInput` | `components/recipes/RecipeFilters`, `components/inputs/SearchInput` | 2.3 |
| `RecipeDetail`, `DetailLayer` | `components/recipes/detail/RecipeDetail`, `components/overlays/DetailLayer` | 2.2, 2.3 |
| `AppShell`, `EmptyState`, `Button`, `Toast` | `components/layout/AppShell`, `components/feedback/*`, `components/inputs/Button` | 2.1, 2.3 |
| `KeyDialog`, `TmpPendingChanges` | `components/pantry/KeyDialog`, `components/feedback/TmpPendingChanges` | 2.1, 2.3 |
| `TmpSegmentedControl` | `components/inputs/TmpSegmentedControl` | 2.3 |

**New**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `FavoriteButton` | the heart, icon-only or labeled | 2.1, 2.2, 2.3 | Already in the registry as Beta (`components/recipes/FavoriteButton`); this feature builds it and adds `label` and `recipeTitle` |
| `RecipeRow` | recipe row with link and heart | 2.1, 2.3 | Extracted from `RecipeLibrary`; add to the registry |
| `ProfileScreen` | Perfil screen with the favorites tab | 2.3 | Screen-level, not a kit component |

## 6. Deviations from PRD (Approved)

None. Two PRD details are made concrete by the prototype: in `panel` mode the photo and the button share grid column 1 (2fr) beside Info general (3fr), and the labeled button has the width of its content on medium and large (approved 2026-10-30).

## 7. Open Items

None. `FavoriteButton` and `RecipeRow` registry entries are updated by `document-manager` with the docs of this feature.
