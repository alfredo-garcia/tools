# UX Flow: Responsive Recipe Layout

> Project: `my-food-manager`
> Source PRD: `004_responsive-recipe-layout_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/004_responsive-recipe-layout/index.html` (clickable, real Drive recipes, working filters; route simulated with `#/recipes/<id>`)
> Status: Approved by user on 2026-10-29

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Every line resolves to a concrete rendering or data instruction. Visual values come from `ui_standards.md` tokens and are not repeated here. This document changes only what differs from `002_recipe-detail_ux_flow.md` and `003_recipe-filters_ux_flow.md`; everything not mentioned stays as specified there.

## 1. Flow Summary

The recipe list and the recipe detail adapt to three window widths. Small keeps the full-screen detail, medium keeps the modal (now with the title always in its header), and large shows the list as a left column and the detail in a right panel.

- Small / medium: `SCR-library-list` → (tap a row) → `SCR-recipe-detail` as full screen / modal → (back, close, Esc, backdrop) → `SCR-library-list`
- Large: `SCR-library-list` (column) + empty panel → (choose a row) → panel shows `SCR-recipe-detail` → (choose another row) → panel shows the new recipe → (close) → empty panel

## 2. Screens

### 2.1. Layout selection (applies to both screens)

`layout` is derived from the window width: `small` if `< 640`, `medium` if `640–1279`, `large` if `>= 1280`. It re-evaluates when the window resizes or rotates and never reloads data. Changing `layout` keeps the open recipe, the detail's scroll position, `sectionOpen`, `timeOpen`, the list scroll position and the active filters.

### 2.2. Recipe list

- **Platform**: Web
- **Purpose**: the existing list with filters; in `large` it is a column beside the detail panel.
- **Route / entry point**: `/` and every `/recipes/<id>` address (the list is always rendered).

**Data required**: unchanged (library from `useLibrary()`, filter state from the page). Additionally `selectedRecipeId: string | undefined`, taken from the address.

**Component tree**

- If `layout !== "large"`: `<AppShell title="Recetas">` as today (centered, max width 3xl) containing `<RecipeFilters>` and the rows.
- If `layout === "large"`: a two-region container filling the viewport height, without the centered maximum width:
  - Left region, 400 px wide, its own vertical scroll, a right border: `<AppShell title="Recetas">` content (title, sync badge, refresh button, `<RecipeFilters>`, rows). Title, badge, button and filters scroll with the rows.
  - Right region, remaining width: the detail panel (see 2.3).
- `<RecipeFilters>` (kit): the filter chips wrap onto as many lines as needed; no horizontal scroll at any layout. The options panel opens under the chips row as today.
- Each row's `<RecipeLink>` carries `aria-current="true"` and the selected style (border `color.primary.500`, soft primary fill) when `recipe.id === selectedRecipeId`.

**Conditional rendering states**

- All list states of `003_recipe-filters_ux_flow.md` are unchanged and render inside the left region in `large`.
- If `selectedRecipeId` is defined and filters hide that recipe, render no row as selected; keep the panel as is.
- If `layout !== "large"` and `selectedRecipeId` is defined, the list is inert (as in feature 002).
- If `layout === "large"`, the list is never inert.

**Interactions / transitions**

- Large, tap a row while no recipe is open → pushes `/recipes/<id>`; focus stays on the row.
- Large, tap a row while a recipe is open → replaces the current history entry with `/recipes/<id>`; focus stays on the row.
- Small / medium, tap a row → pushes `/recipes/<id>` and opens the detail as in feature 002.
- Pull-to-refresh starts a sync only when the touch begins in the list region; touches inside the detail or the panel never start it.

### 2.3. Recipe detail

- **Platform**: Web. **Divergence by layout**: `small` full screen, `medium` modal, `large` side panel.
- **Purpose**: unchanged.
- **Route / entry point**: unchanged (`/recipes/<id>`, from a row, from an ingredient link, or directly).

**Data required**: unchanged from `002_recipe-detail_ux_flow.md`, plus `layout`.

**Component tree**: `<DetailLayer mode={layout === "small" ? "fullscreen" : layout === "medium" ? "modal" : "panel"}>` (kit: `components/overlays/DetailLayer`, new `mode` prop) wrapping the unchanged content (16:9 photo, Info general, Ingredientes, Pasos, Notas).

- `fullscreen`: as in feature 002 (back button at the left, compact title appears when the in-body title leaves the view, page scroll locked, focus trapped, list inert).
- `modal`: centered, max width 720 px, 90% height, dimmed backdrop, `role="dialog" aria-modal="true"`. The bar always shows the recipe title (one line, truncated, full title in the `title` attribute) at the left and `<Button variant="ghost" icon={X} aria-label="Cerrar" />` at the right. The in-body `<h1>` is not rendered visibly. Esc and backdrop click close it. Page scroll locked, focus trapped, list inert.
- `panel`: fills the right region, no maximum width, no backdrop, no border radius or shadow, `role="region"` with an accessible name equal to the recipe title. The bar is the same as in `modal` (title always visible, "Cerrar" at the right) and stays fixed while the content scrolls. Page scroll is not locked, focus is not trapped, the list is not inert, Esc does nothing.
- In `panel` the content is a grid of two columns, `2fr` and `3fr`, with a 1rem gap and 1rem padding: the photo (16:9, `radius.md`) in the first column and the Info general section in the second, both in the first row and aligned to the top. Ingredientes, Pasos and Notas follow in the next rows across both columns. In `fullscreen` and `modal` the photo is above all sections, full width, as in feature 002.
- The scroll area of the detail is the only scrolling element inside the layer in every mode.

**Conditional rendering states**

- If `layout === "large"` and no recipe is selected, render in the right region, centered: `<EmptyState emoji="🍽️" title="Elige una receta" hint="Se abrirá aquí, sin perder la lista." />`, with no bar.
- If `layout === "large"` and the library is not ready and the address names a recipe, render `<EmptyState emoji="🍳" title="Cargando tu receta…" />` in the panel, with the bar and "Cerrar".
- If the recipe is not found, render `<EmptyState emoji="🔍" title="Receta no encontrada" action={<Button onClick={close}>Volver a recetas</Button>} />`; in `large`, `close` empties the panel.
- All other states: as in feature 002.
- If `layout` changes while a recipe is open, render the same recipe in the new mode; the content, scroll position, `sectionOpen` and `timeOpen` are kept.

**Interactions / transitions**

- Tap/click "Cerrar" or "Atrás" in `fullscreen` / `modal` → as in feature 002.
- Tap/click "Cerrar" in `panel`, or use the device back button → the panel becomes empty and the address becomes `/`; if the recipe was opened directly, the address is replaced by `/`. Focus goes to the previously selected row if it is still in the list.
- Tap an ingredient link in any mode → pushes `/recipes/<linkedId>`, the content resets to the top with all sections open, as in feature 002; in `panel` the list selection follows the address.
- Tab order in `large`: list region first, then the panel.

## 3. Navigation Map

```
/                       small/medium: list      large: list column + empty panel
   │ tap row                                        │ choose row (push)
   ▼                                                ▼
/recipes/<id>           small: full screen      large: list column + panel (selected row highlighted)
                        medium: modal                  ├─ choose another row ──► /recipes/<otherId> (replace)
   ├─ back / close / Esc / backdrop ─► previous entry or "/"   ├─ ingredient link ─────► /recipes/<linkedId> (push)
   └─ ingredient link ─► /recipes/<linkedId> (push)            ├─ Cerrar / device back ─► "/" (empty panel)
                                                               └─ unknown id ─► "Receta no encontrada" ─► "/"
Resize across 640 or 1280: the open recipe stays open in the layout that fits.
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `layout` | `"small" \| "medium" \| "large"` | derived from the window width by `layoutForWidth(width)` (pure helper in `src/lib/domain`) |
| `selectedRecipeId` | string or undefined | address `/recipes/<id>` |
| Everything else | unchanged | features 001, 002, 003 |

No new endpoints and no writes (PRD §7, §8).

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `DetailLayer` (new `mode` prop: `fullscreen`, `modal`, `panel`) | `components/overlays/DetailLayer` | 2.3 |
| `RecipeFilters` (chips wrap) | `components/recipes/RecipeFilters` | 2.2 |
| `RecipeLink` (adds `aria-current`) | `components/recipes/RecipeLink` | 2.2 |
| `AppShell` (no centered maximum width in `large`) | `components/layout/AppShell` | 2.2 |
| `EmptyState`, `Button`, `RecipePhoto`, `CollapsibleSection` | as registered | 2.3 |

**New — temporary (needs formalizing before/at ship time)**

None. The new behavior extends registered components.

## 6. Deviations from PRD (Approved)

None. The UX Flow follows `004_responsive-recipe-layout_prd.md`.

## 7. Open Items

- **Documentation to update with implementation:** `ui_standards.md` §4 (breakpoints `small <640`, `medium 640–1279`, `large >=1280`; the panel is exempt from the 720 px maximum) and §9; `ui_kit_registry.md` entries for `DetailLayer` (new `mode`), `RecipeLibrary` and `RecipeLink`.
- **State across layouts:** keeping scroll, `sectionOpen` and `timeOpen` when the layer changes mode requires the detail content not to be rebuilt from scratch; implementation flags it if impossible.
- **Compact bar on `small`:** the exact scroll offset that shows the title is left to implementation, as in feature 002.
- **Future grid and navigation sidebar:** their combination with the column and the panel is decided in their own features.
