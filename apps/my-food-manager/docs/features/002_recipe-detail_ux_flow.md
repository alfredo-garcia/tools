# UX Flow: Recipe Detail

> Project: `my-food-manager`
> Source PRD: `002_recipe-detail_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/002_recipe-detail/index.html` (clickable, real Drive recipes; route simulated with `#/recipes/<id>`)
> Status: Approved by user on 2026-10-29

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Every line resolves to a concrete rendering or data instruction. Visual values (colors, radii, type styles, spacing) come from `ui_standards.md` tokens and are not repeated here.

## 1. Flow Summary

Tapping a recipe row in the list opens the recipe detail on its own address `/recipes/<id>`. On viewports narrower than 1024 px the detail is a full screen with a "Atrás" button; at 1024 px or wider it is a large modal over the list with a close button. The detail shows the photo, the title and four collapsible sections. A recipe link inside the ingredients opens another detail.

- `SCR-library-list` → (tap a row) → `SCR-recipe-detail` (address `/recipes/<id>`)
- `SCR-recipe-detail` → (tap an ingredient that links to a recipe) → `SCR-recipe-detail` of the linked recipe (new history entry)
- `SCR-recipe-detail` → (back button, close button, Esc, backdrop click, device back gesture) → previous history entry, or `SCR-library-list` (`/`) when the detail was opened directly
- Any address with an unknown id → `SCR-recipe-detail` in `notFound` state → (tap "Volver a recetas") → `SCR-library-list`

## 2. Screens

### 2.1. Recipe list (modified)

- **Platform**: Web
- **Purpose**: existing proof screen (`SCR-library-list`); each row now opens the recipe detail.
- **Route / entry point**: `/`. Stays mounted under the detail so its scroll position survives opening and closing.

**Data required**: unchanged from feature `my-food-manager/001` (library from `useLibrary()`); the row needs `recipe.id`.

**Component tree**: unchanged, except each row `<li>` content becomes a link.

- `<Link href={"/recipes/" + recipe.id}>` wraps the row (min height 56 px). Inside: `<RecipePhoto>` (kit) + title + category name, as today.

**Conditional rendering states**: unchanged (loading, offline with no data, error with no data, empty, list).
- While the detail is open, the list is inert (not focusable, not scrollable) and remains rendered.

**Interactions / transitions**

- Tap/click a row → pushes `/recipes/<id>` → renders `SCR-recipe-detail` over the list.
- When the detail closes, focus returns to the row that opened it.

### 2.2. Recipe detail

- **Platform**: Web. **Divergence by viewport width**: `< 1024 px` = full screen; `>= 1024 px` = modal. Resizing across 1024 px switches layout without closing the detail or resetting scroll and section state.
- **Purpose**: show a recipe's photo, facts, ingredients, steps and notes for reading and cooking.
- **Route / entry point**: `/recipes/<id>`, from `SCR-library-list` rows, from an ingredient recipe link, or opened directly (typed, bookmarked, installed app), including offline.

**Data required**

| Field | Type | Source |
|---|---|---|
| `recipe` | Recipe (`id`, `title`, `category`, `tags`, `servings`, `time`, `difficulty`, `ingredients`, `steps`, `notes`, `variations`, `source`, `photoVersion`) | `useLibrary().library.recipes` found by route `id` |
| `library.vocab.categories` | map id → `{label}` | `useLibrary().library` |
| `library.vocab.tags` | map family → `{label, values}` | `useLibrary().library` |
| `library.ingredients` | map id → `{name}` | `useLibrary().library` |
| `library.recipes` | list, to resolve `ingredient.recipe` links | `useLibrary().library` |
| `hydrated`, `library`, `status` | boolean, Library or null, status | `useLibrary()` |
| `sectionOpen` | `{info, ingredients, steps, notes}` booleans, all `true` initially | local state, discarded when the detail closes |
| `timeOpen` | boolean, `false` initially | local state |
| `isCompact` | boolean | derived: `true` when the in-body title `<h1>` is not visible in the scroll area |
| `isDesktop` | boolean | derived: viewport width >= 1024 px |

The servings unit label uses a fixed map: `people` → "personas", `units` → "unidades", `portions` → "porciones"; `g`/`ml` use the units vocabulary (see §6).

**Component tree** (layout order)

- `<TmpRecipeDetailLayer>` (**NEW — temporary**): renders full screen when `!isDesktop`; when `isDesktop` renders a dimmed backdrop with a centered modal panel (width 720 px max per ui_standards §4, 92% of the viewport, height 90%). Traps focus, sets the page behind inert, `role="dialog" aria-modal="true" aria-labelledby=<title id>`.
  - `<TmpDetailBar>` (**NEW — temporary**): fixed at the top of the layer.
    - If `!isDesktop`: `<Button variant="ghost" icon={ArrowLeft} aria-label="Atrás">Atrás</Button>` at the left (min 44 x 44 px), then the compact title.
    - If `isDesktop`: compact title at the left, `<Button variant="ghost" icon={X} aria-label="Cerrar" />` at the right.
    - Compact title: recipe title, one line, truncated; visible only when `isCompact === true` (fades in); `aria-hidden` always (the in-body `<h1>` is the accessible title). A bottom border and `elevation.1` appear when `isCompact === true`.
  - Scroll area (the only scrolling element; max content width 720 px centered):
    - `<RecipePhoto recipeId={recipe.id} photoVersion={recipe.photoVersion} category={recipe.category} />` (kit: `components/recipes/RecipePhoto`), full width, aspect 16/9 (`aspect="16/9"`) on mobile and desktop.
    - `<h1 id="recipe-title">` with `recipe.title` (style `heading-1`).
    - `<TmpCollapsibleSection id="info" title="Info general">` containing `<TmpInfoList>` (**NEW — temporary**), a two-column list (label 104 px, value), rows in this order:
      1. "Categoría": category label in a chip tinted with `cat.<category>`; `-` if no category or `unclassified`.
      2. "Tiempo": `<TmpTimeDisclosure>` (**NEW — temporary**), a button (min height 44 px) showing the total time and a chevron; `aria-expanded={timeOpen}`; chevron points right when closed and down when open. Total = prep + cook + rest, formatted "N min" under 60 and "H h M min" from 60; `-` and the button `disabled` with no chevron when all three are missing. When `timeOpen`, a block spanning both columns lists "Preparación", "Cocción", "Reposo" with their formatted values or `-`.
      3. "Dificultad": flame icon (lucide `Flame`, 14 px) + "Fácil" / "Media" / "Difícil"; `-` if missing.
      4. "Raciones": "<qty> <unit label>" (e.g. "12 unidades"); `-` if `servings` or `servings.qty` is missing.
      5. "Técnica": chips from `tags.technique`; `-` if empty.
      6. "Cocina", 7. "Dieta", 8. "Proteína", 9. "Ocasión": chips from `tags.cuisine|diet|protein|occasion`; `-` if empty. A tag id missing from the vocabulary renders its raw id.
    - `<TmpCollapsibleSection id="ingredients" title="Ingredientes">`: ungrouped lines first (no heading), then one `<TmpIngredientGroup>` per named group in order of first appearance, with the group name as a heading (slug humanized: hyphens to spaces, first letter uppercase). An empty-string group counts as ungrouped.
      - `<TmpIngredientLine>` (**NEW — temporary**) per line: quantity column (min width 72 px, bold) + name + muted note.
        - Measured unit: "<qty> <unit label>" (original unit, never converted; decimal comma, at most 2 decimals) then the ingredient name from the catalog, then `· <note>` if present.
        - Unit `to-taste`, `as-needed` or `pinch`: empty quantity column; name, then `· <unit label>` and `· <note>` if present (e.g. "sal · al gusto").
        - No quantity and no unmeasured unit: quantity column shows `-`.
        - `optional === true`: a small "opcional" tag after the name.
        - `line.recipe` set and that recipe exists in `library.recipes`: the name is a link to `/recipes/<line.recipe>` with a `ChevronRight` icon (14 px); otherwise plain text.
        - Name missing from the catalog: raw `ing` id.
      - If `recipe.ingredients.length === 0`: the section body is `-`.
    - `<TmpCollapsibleSection id="steps" title="Pasos">`: `<TmpStepList>` (**NEW — temporary**), an ordered list in file order, each item with a numbered circle (1-based) and the step text (style `body`). If `recipe.steps.length === 0`: the body is `-`.
    - `<TmpCollapsibleSection id="notes" title="Notas">` (rendered only if notes, variations or source exist): blocks "Notas" (bullet list), "Variaciones" (paragraph), "Fuente" (source type label and author as text; if `source.url`, a link "Abrir enlace" with `ExternalLink` icon, `target="_blank" rel="noopener"`). Blocks without data are omitted. Source type labels: `instagram` → "Instagram", `own` → "Propia"; other types render the raw type.
- `<TmpCollapsibleSection>` (**NEW — temporary**) contract: header is a heading (`<h2>`) containing a full-width button (min height 56 px, style `heading-2`) with the title and a `ChevronDown` icon at the right; `aria-expanded`, `aria-controls` on the panel; the panel is a `role="region"` labelled by the button. Chevron points down when open and right when closed. Collapsing animates the panel height (`duration.base`).

**Conditional rendering states**

- If `!hydrated`, or (`library === null` and `status` is `"syncing"` or `"idle"`), render the layer with `<TmpDetailBar>` (no title) and `<EmptyState emoji="🍳" title="Cargando tu receta…" />` with a spinner.
- If `library === null` and `status === "offline"`, render the layer with `<EmptyState emoji="📡" title="Necesitas conexión la primera vez" action={<Button onClick={refresh}>Reintentar</Button>} />`; same pattern with `status === "error"`: `title="No se pudo cargar tu biblioteca"`.
- If `library !== null` and no recipe has `id === routeId`, render `<EmptyState emoji="🔍" title="Receta no encontrada" hint="Puede que se haya borrado de Drive." action={<Button onClick={goToList}>Volver a recetas</Button>} />` with the title as the dialog's accessible name.
- If `recipe` is found, render the normal component tree above.
- If a sync replaces `library` while the detail is open and `recipe` still exists, re-render in place keeping scroll, `sectionOpen` and `timeOpen`; if the recipe no longer exists, switch to the `notFound` state.
- If `isCompact === true`, show the compact title in `<TmpDetailBar>`; otherwise hide it.
- If the browser cannot store data (`storageOk === false`), the detail works from memory with no extra notice on this screen (the list shows the notice).

**Interactions / transitions**

- Tap/click "Atrás" (mobile) or "Cerrar" (desktop) → goes back one history entry; if the detail was opened directly and has no previous in-app entry, replaces the address with `/`. Focus returns to the originating row when it exists.
- Press Esc (desktop modal), click the backdrop (desktop modal) or use the device back gesture → same as above.
- Tap a `<TmpCollapsibleSection>` button → toggles only that section's `sectionOpen` value; no navigation.
- Tap `<TmpTimeDisclosure>` → toggles `timeOpen`; no navigation. Back gesture while `timeOpen` closes the detail (not the disclosure).
- Tap an ingredient link → pushes `/recipes/<line.recipe>`; the layer re-renders with that recipe, scroll resets to the top, `sectionOpen` resets to all open and `timeOpen` to `false`. Back returns to the previous recipe.
- Tap the source link → opens the URL in a new tab.
- Scroll the scroll area → updates `isCompact`; the list behind does not scroll.
- Tab key cycles only through the layer's focusable elements. On open, focus goes to "Atrás" (mobile) or "Cerrar" (desktop).
- With `prefers-reduced-motion: reduce`, the layer entrance and the section/time animations are disabled.

## 3. Navigation Map

```
/ (SCR-library-list)
   │ tap row
   ▼
/recipes/<id> (SCR-recipe-detail)
   ├─ ingredient link ───────────► /recipes/<linkedId> ──► back ──► previous recipe
   ├─ back / close / Esc / backdrop / device back ──► previous entry, or "/" if opened directly
   ├─ unknown id ─────► notFound ──► "Volver a recetas" ──► "/"
   ├─ library not ready ─► loading ──► detail or notFound
   └─ no library + offline/error ─► empty state with "Reintentar"
Direct open (typed / bookmarked / installed app): /recipes/<id> with "/" rendered behind (desktop) or hidden (mobile)
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| Route `id` | string | address `/recipes/<id>` |
| `recipe.*` (title, category, tags, servings, time, difficulty, ingredients, steps, notes, variations, source, photoVersion) | existing `Recipe` | `useLibrary().library.recipes` |
| Category, tag and ingredient labels | vocab and catalog maps | `useLibrary().library.vocab` / `.ingredients` |
| Unit labels | map id → label | `library.vocab.units`, plus the fixed servings-unit map |
| `sectionOpen`, `timeOpen` | local booleans | local state |
| `isCompact`, `isDesktop` | derived booleans | scroll position, viewport width |

No new endpoints and no writes (PRD §7, §8).

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `RecipePhoto` | `components/recipes/RecipePhoto` (implemented in `src/components/recipes/RecipePhoto.tsx`) | 2.1, 2.2 |
| `Button` (`ghost`, `primary`) | `components/inputs/Button` | 2.2 |
| `EmptyState` | `components/feedback/EmptyState` | 2.2 |
| `AppShell` | `components/layout/AppShell` | 2.1 (unchanged) |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `TmpRecipeDetailLayer` | Full screen below 1024 px, modal at 1024 px or wider; focus trap, inert page, backdrop, Esc | 2.2 | The registry's `Sheet` is a bottom sheet on mobile; this needs a full-screen variant or its own component. |
| `TmpDetailBar` | Fixed bar with back/close button and a compact title that appears on scroll | 2.2 | |
| `TmpCollapsibleSection` | Titled card with chevron toggle and animated panel | 2.2 | Candidate for the kit (`CollapsibleSection`). |
| `TmpInfoList` | Two-column label/value list with chips | 2.2 | |
| `TmpTimeDisclosure` | Total-time button with an expandable breakdown | 2.2 | |
| `TmpIngredientGroup` / `TmpIngredientLine` | Grouped ingredient lines with quantity column, notes, optional tag and recipe link | 2.2 | |
| `TmpStepList` | Numbered steps | 2.2 | |
| `TmpStaticChip` | Non-interactive chip for tags and category | 2.2 | The registry's `Chip` is a pressed/unpressed toggle and is not implemented in `src/components` yet. |

## 6. Deviations from PRD (Approved)

The PRD was updated on 2026-10-29 to include the first two rows below; they are kept here as the paper trail.

| PRD said | We shipped instead | Why / who approved |
|---|---|---|
| US-3 / FR-7: the header shows the photo, title, category, time group, difficulty, servings and technique chips | The header has only the photo and the title. Category, time, difficulty, servings and technique are rows in the "Info general" section, together with cocina, dieta, proteína and ocasión | Four small cards were too tight on a 390 px viewport; user approved on 2026-10-29 |
| US-6: Info general lists only the four tag families | Info general lists nine rows (category, time, difficulty, servings, technique, plus the four tag families), in a single section | Same decision |
| US-5.1: four sections (Info general, Ingredientes, Pasos, Notas) | Unchanged in count and order; the compact bar and title appear when the in-body title scrolls out of view | n/a, clarification |
| US-3.5: the servings unit label comes from the units vocabulary | Servings units `people`, `units`, `portions` use a fixed map (personas, unidades, porciones) because they are not in `_system/units.yaml` | Found while building the prototype; accepted by the user's approval of the prototype |

## 7. Open Items

**Implementation notes (2026-10-29):** `TmpRecipeDetailLayer` + `TmpDetailBar` shipped as `components/overlays/DetailLayer`; `TmpCollapsibleSection` as `components/recipes/detail/CollapsibleSection`; `TmpStaticChip` as `components/recipes/TagChip`; the info, ingredients, steps and notes sections as `components/recipes/detail/*Section`. All still need registry entries. Quantities show mass and volume units abbreviated (g, kg, ml, l) and other unit labels pluralized when the quantity is not 1 ("2 unidades"), instead of the raw vocabulary label ("gramos"). The loading state uses `EmptyState` without a spinner, like the list.


- **Compact bar threshold:** the compact title appears when the in-body title leaves the visible area; the exact scroll offset is left to implementation.
- **Offline address handling:** the detail opens in place with the History API (`pushState` / `replaceState`), so tapping a row or an ingredient link needs no request and works offline. Opening an address of a recipe never visited, directly and with no connection, is not covered: it depends on the service worker having that page cached. Follow-up for the offline work, not part of this feature.
- **`RecipePhoto` props:** the registry lists `photoUrl`/`aspect`, while the implemented component takes `recipeId`, `photoVersion`, `category`, `className`. The implemented props are used here; the registry entry should be corrected after merge.
