# UX Flow: Meal Plan Calendar

> Project: `my-food-manager`
> Source PRD: `008_meal-plan-calendar_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/008_meal-plan-calendar/index.html` (clickable; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; toolbar to simulate connection, stored key, data state loading / plan unavailable / empty library, and a rejected change)
> Status: Approved by user on 2026-10-30

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Every line resolves to a concrete rendering or data instruction. Visual values come from `ui_standards.md` tokens and are not repeated here. The app frame and navigation stay as specified in the `006` UX Flow; the pending-changes indicator, the write key dialog and the outbox behave as in the `007` UX Flow. Copy is Spanish.

## 1. Flow Summary

The "Plan" section (`/plan`) shows one screen: the household's meal calendar from today onward. Small windows (<640 px) show days stacked and append 7 days at the end of the scroll; medium and large windows (>=640 px) show one Monday–Sunday week in columns with previous/next week buttons. Each day has three slots (Desayuno, Almuerzo, Cena). "Añadir" on a slot opens the recipe picker (`Sheet`); "Añadir receta" adds the recipe and, if ingredients are missing, opens the missing-ingredients sheet.

- `SCR-plan` → (tap "Añadir" in a slot) → `RecipePickerSheet` → (pick a recipe, tap "Añadir receta") → `SCR-plan` with the recipe in the slot
- `RecipePickerSheet` → (tap "Añadir receta", ingredients missing) → `MissingIngredientsSheet` → (tap "Continuar", Esc or backdrop) → `SCR-plan`
- `MissingIngredientsSheet` → (tap "Añadir a mi lista de la compra") → `SCR-plan` (missing ingredients marked "Comprar")
- `SCR-plan` → (tap X on a recipe) → `SCR-plan` without that recipe
- `SCR-plan` → (tap a recipe) → recipe detail (`DetailLayer`, feature 002) → close → `SCR-plan`
- Any change with no stored key → `KeyDialog` (after any open picker or missing sheet is closed) → pending changes sent
- `SCR-plan` (>=640 px) → (tap next/previous week) → `SCR-plan` another week

## 2. Screens

### 2.1. Plan screen (`SCR-plan`)

- **Platform**: Web. **Divergence by layout**: `small` (<640 px) renders `<PlanDayList>`, bottom navigation and bottom sheets; `medium` (640–1279 px) and `large` (>=1280 px) render `<PlanWeek>`, the sidebar of `006` and centered modals. On `medium` the week scrolls horizontally; on `large` the seven columns fit (with the sidebar expanded, 132 px minimum per column).
- **Purpose**: see and edit what the household will eat each day.
- **Route / entry point**: `/plan` (Plan in the main navigation). Title of the browser tab: "Plan · My Food". Opens offline from the cache.

**Data required**

| Field | Type | Source |
|---|---|---|
| `library` | `Library` (recipes with `id`, `title`, `category`, `time`, `ingredients`, `photoVersion`; ingredients catalog with `staple`; `pantry`; `plan`) | `useLibrary()` (stored snapshot, offline-first) |
| `status`, `syncedAt` | sync state | `useLibrary()`, shown with `<SyncBadge>` |
| `pending` | `({ id: string; kind: "plan.addRecipe" \| "plan.removeRecipe"; date: string; meal: Meal; recipe: string } \| { id: string; kind: "pantry.setBuy"; ingredient: string; value: boolean })[]` | outbox (`lib/offline`), persisted on the device |
| `keyStored` | boolean | device preference for the write key |
| `isOnline` | boolean | `navigator.onLine` events |
| `today` | `YYYY-MM-DD` | the device's local date, recomputed on window focus / visibility change |
| `planShown` | `{ [date]: { breakfast: Dish[]; lunch: Dish[]; dinner: Dish[] } }`, `Dish = { recipe: string } \| { text: string }` | `planWithPending(library.plan, pending)` (pure, domain: stored plan with the outbox applied in order; dishes grouped by slot across the meals of that slot; `snack` meals not included) |
| `pantryShown` | `{ have: Set<id>; buy: Set<id> }` | `pantryWithPending(library.pantry, pending)` (existing, feature 007) |
| `visibleDays` | number | local state, `8` on small windows; `+7` each time the end sentinel is reached |
| `weekOffset` | number >= 0 | local state, `0` = current week; only used on medium and large |
| `picker` | `{ date, meal, selected: string \| null, typed: string, applied: string } \| null` | local state |
| `missing` | `{ recipe: string; ingredients: string[] } \| null` | local state, ids of the missing ingredients |
| `keyDialogOpen`, `toast` | boolean, string \| null | local state (as in `007`) |

`Meal` is `"breakfast" \| "lunch" \| "dinner"`; labels in order: Desayuno, Almuerzo, Cena. A recipe id that is not in `library.recipes` is dropped by `planWithPending`.

**Component tree**

- `<PlanScreen>` (**NEW**, `components/plan/PlanScreen`, rendered by `src/app/plan/page.tsx` in place of `<TmpComingSoon>`)
  - Frame: `<AppShell title="Plan" wide={layout !== "small"}>` (kit: `components/layout/AppShell`; the new optional prop `wide` raises the content width from 768 to 1180 px) with the title, `<SyncBadge>`, the refresh button and pull-to-refresh
  - If `pending.length > 0`: `<TmpPendingChanges count={pending.length} keyNeeded={!keyStored} onEnterKey={openKeyDialog} />` (reused, `components/feedback/TmpPendingChanges`)
  - If layout is `small`: `<PlanDayList days={visibleDays} />` (**NEW**, see 2.2)
  - If layout is `medium` or `large`: `<PlanWeek offset={weekOffset} />` (**NEW**, see 2.3)
  - If `picker !== null`: `<RecipePickerSheet />` (**NEW**, see 2.4)
  - If `missing !== null`: `<MissingIngredientsSheet />` (**NEW**, see 2.5)
  - If `keyDialogOpen`: `<KeyDialog rejected={...} onSave onClose />` (reused, `components/pantry/KeyDialog`)
  - If `toast !== null`: `<Toast message={toast} />` (kit: `components/feedback/Toast`; auto-dismiss after 4 s)

**Conditional rendering states**

- If the library is loading and there is no stored library, render the title row and three skeleton blocks (inline in `PlanScreen`; 128 px tall, `radius.md`, pulse disabled under `prefers-reduced-motion`).
- If there is no stored library and offline, or the load failed, render the same `<EmptyState>` with "Reintentar" as the recipe list.
- If `library.plan` is absent (the file `plan/plan.yaml` does not exist or cannot be read), render `<EmptyState emoji="📅" title="El plan todavía no está disponible en Drive" hint="Se activará cuando exista el archivo del plan. Tus recetas siguen disponibles." action={<Button variant="secondary" onClick={retry}>Reintentar</Button>} />` and no days, no "Añadir", no "X".
- If `isOnline === false`, `<SyncBadge status="offline" />`; everything else behaves the same and changes become pending.
- If `pending.length > 0 && isOnline && keyStored`, `<TmpPendingChanges>` shows "N cambios pendientes" (singular "1 cambio pendiente") without button; if `!keyStored`, it also shows "Introducir clave".
- If the day changes while the screen is open, recompute `today` on the next focus/visibility event; the previous day becomes read-only (medium, large) or is removed from the list (small) keeping the scroll position.
- If `prefers-reduced-motion` is set, sheet entry, skeleton shimmer and list changes have no transition.

**Interactions / transitions**

- Tap "Añadir" in a slot → `picker = { date, meal, selected: null, typed: "", applied: "" }`.
- Tap a recipe in a slot (photo or title) → opens `<RecipeDetail id={recipe} overlay onClose={closeDetail} />` (`components/recipes/detail/RecipeDetail`, which hosts `DetailLayer`: fullscreen on small, modal on medium and large, never the side panel) over the Plan without changing the address; closing returns to the same scroll position.
- Tap X of a recipe → `removeDish(date, meal, recipe)`: appends a `plan.removeRecipe` operation, the recipe disappears at once, announces "<título> quitada" in a polite live region; no confirmation, no undo; the shopping list is not touched.
- Change of window width across 640 px → the layout changes between `<PlanDayList>` and `<PlanWeek>`; open `picker` and `missing` stay open, keeping text and selection.
- A sync that updates the library keeps scroll position, `weekOffset`, `visibleDays`, `picker` and `missing`, and re-computes `planShown` from `library` plus `pending`.
- If a change is rejected by the server, the optimistic change is reverted and `toast = "No se pudo guardar <título de la receta>"` (or "<ingrediente>" for `pantry.setBuy`).

### 2.2. Day list (`PlanDayList`, small windows)

- **Platform**: Web, `small` only.
- **Purpose**: vertical list of days from today with 7 more days loaded at the end.
- **Route / entry point**: inside `SCR-plan`.

**Data required**: `visibleDays`, `today`, `planShown`.

**Component tree**

- `<PlanDayList>` (**NEW**, `components/plan/PlanDayList`; max width 720 px, centered)
  - One `<PlanDay date heading={dayHeading} today={i === 0}>` (**NEW**, `components/plan/PlanDay`) per day, for `i` from 0 to `visibleDays - 1`: `<section aria-label="<weekday day month>">` with `<h2>`; heading is "Hoy" (day 0), "Mañana" (day 1) with the full date as a `caption` beside it, otherwise the weekday, day and month ("jueves 5 nov"); the heading of today is `color.primary.500`.
    - Three `<PlanSlot date meal label past={false} />` in the order Desayuno, Almuerzo, Cena (see 2.2.1)
  - End sentinel `<div id="more" aria-hidden style={{height: 1}} />` observed with `IntersectionObserver` (root: the scrolling area, `rootMargin: "0px 0px 80px 0px"`)

**Conditional rendering states**

- If the sentinel intersects, `visibleDays += 7` (no upper limit, also offline: days are generated locally).
- Otherwise render `visibleDays` days.
- Days before `today` are never rendered.

**Interactions / transitions**

- Scroll to the end → 7 more days are appended below; scroll position is kept.

#### 2.2.1. Slot (`PlanSlot`, shared by 2.2 and 2.3)

- `<PlanSlot date meal label past columns>` (**NEW**, `components/plan/PlanSlot`): `<section aria-label="<label>, <weekday day month>">`, surface `color.surface.1`, border `color.border`, `radius.md`, padding 12 px (8 px when `columns`).
  - `<h3>` slot name in `caption`, uppercase, 800 weight, +0.06em tracking, `color.text.muted`
  - If the slot has dishes: `<ul>` of `<PlanRecipeItem>` / text dishes in file order (all meals of that slot together)
  - If `!past`: a dashed pill button `<button aria-label="Añadir receta a <label en minúscula>, <weekday day month>">` with a `Plus` icon (lucide-react, 14 px) and the text "Añadir", full width, minimum height 44 px, `color.primary.500`; on hover or focus: `color.primary.soft` fill

- `<PlanRecipeItem recipeId title past columns>` (**NEW**, `components/plan/PlanRecipeItem`): `<li>` minimum height 56 px (48 px when `columns`), bottom border `color.border` (not on the last).
  - Open control `<button>`: if `!columns`, `<RecipePhoto recipeId photoVersion category className="size-11 rounded-sm" />` (kit: `components/recipes/RecipePhoto`), then the title in `label` weight 600, clamp 2 lines (3 when `columns`); if `columns`, no photo, the category emoji of the recipe as text before the title (`aria-hidden`).
  - If `!past`: `<button aria-label="Quitar <título>">` with an `X` icon (lucide-react, 20 px), 44×44 px, `color.text.muted`, `color.danger.500` on hover/focus.
- Text dish (`{ text }`): `<li>` with the text in `color.text.muted`, no photo, no X, no open control.

### 2.3. Week view (`PlanWeek`, medium and large windows)

- **Platform**: Web, `medium` and `large`.
- **Purpose**: see one Monday–Sunday week in columns and move between weeks.
- **Route / entry point**: inside `SCR-plan`.

**Data required**: `weekOffset`, `today`, `planShown`. `weekStart` = Monday of the current week + `7 × weekOffset` days; `weekEnd` = `weekStart` + 6 days.

**Component tree**

- `<PlanWeek>` (**NEW**, `components/plan/PlanWeek`; max width 1180 px, centered)
  - Header row: `<h2>` with the range ("26 oct – 1 nov", `heading-2`) and, if `weekOffset === 0`, a tag "Esta semana" (`caption`, `color.primary.500` on `color.primary.soft`, `radius.full`)
  - `<WeekNav>` (**NEW**, `components/plan/WeekNav`): two round buttons, 44×44 px, `color.surface.1`, border `color.border`, `elevation.1`, positioned at the left and right edge of the week area (half over the page margin), 120 px below the top of the week area. Left: `ChevronLeft`, `aria-label="Semana anterior"`; right: `ChevronRight`, `aria-label="Semana siguiente"`.
  - `<div role="group" aria-label="Semana">` grid with 7 columns, `grid-template-columns: repeat(7, minmax(132px, 1fr))`, gap 6 px, horizontal scroll (`overflow-x: auto`) when the columns do not fit (medium)
    - One `<PlanColumn date past today>` (**NEW**, `components/plan/PlanColumn`) per day Monday to Sunday: `<section aria-label="<weekday day month>">`, background `color.surface.2`, `radius.md`, padding 8 px; header with the weekday abbreviation (`caption`, uppercase, `color.text.muted`) and the day number below (22 px, 800 weight; `color.primary.500` and a 2 px `color.primary.500` outline on the column when it is today); if `past`, opacity 0.55 and its slots are rendered with `past`
      - Three `<PlanSlot ... columns past={past} />`

**Conditional rendering states**

- If `weekOffset === 0`, the previous button has `aria-disabled="true"`, 35% opacity, no shadow, and ignores taps.
- If `weekOffset > 0`, the previous button is enabled.
- The next button is always enabled.
- If a column's date is before `today` (only in the current week), render it with `past`: dimmed, no "Añadir", no X, recipes still tappable.
- If the grid is wider than its area, the scroll position of the grid is kept across re-renders; a week change resets it to the left.

**Interactions / transitions**

- Tap the next button → `weekOffset += 1`.
- Tap the previous button with `weekOffset > 0` → `weekOffset -= 1`; with `0`, nothing.
- Tap "Añadir" in a column slot → as 2.1.

### 2.4. Recipe picker (`RecipePickerSheet`)

- **Platform**: Web. **Divergence by layout**: `small` renders a bottom sheet (top corners `radius.lg`, height 88% of the window); `medium` and `large` render a centered modal (max width 520 px, height min(640 px, 100%), `radius.lg`, `elevation.3`). This is `Sheet` with the `tall` sizing; see 6 for the `large` exception.
- **Purpose**: choose one recipe for a slot.
- **Route / entry point**: "Añadir" of a slot.

**Data required**

| Field | Type | Source |
|---|---|---|
| `picker` | `{ date, meal, selected, typed, applied }` | `PlanScreen` state |
| `recipes` | `Recipe[]` from the library, sorted by title (Spanish collation) | `library.recipes` |
| `applied` | string | `typed` trimmed, applied 1000 ms after the last keystroke or on Enter; `""` when fewer than 3 characters |

**Component tree**

- `<Sheet open title="Añadir al <desayuno|almuerzo|cena>" subtitle="<weekday day month>" onClose>` (**NEW implementation of a registered component**, `components/overlays/Sheet`: props `open`, `onClose`, `title`, `children`; this feature adds the optional `subtitle`, `size="tall"` and `hideClose`; traps focus, closes on Esc and backdrop, locks page scroll, returns focus to the opener)
  - Bar: `<h2 id>` title with the subtitle in `caption`, and a close button `<button aria-label="Cerrar">` with an `X` icon, 44×44 px, `color.surface.2`
  - `<SearchInput value={typed} placeholder="Buscar receta" label="Buscar receta" onChange onClear onSubmit />` (kit: `components/inputs/SearchInput`)
  - `<ul role="listbox" aria-label="Recetas">` scrolling area, one `<li><button role="option" aria-selected={selected === id}>` per recipe (**NEW**, `RecipePickerOption` inside `RecipePickerSheet`): minimum height 64 px, `<RecipePhoto className="size-12 rounded-sm" />`, the title (`label` weight, 600) and, under it, the time ("45 min", `caption`, muted), and a 24 px round check indicator on the right; the selected option has a 2 px `color.primary.500` border, `color.primary.soft` fill and the check filled
  - Bottom: `<Button variant="primary" disabled={selected === null} onClick={confirm}>Añadir receta</Button>` (kit: `components/inputs/Button`), full width, 48 px high

**Conditional rendering states**

- If `library.recipes.length === 0`, render `<EmptyState emoji="📖" title="No hay recetas todavía" hint="Añade recetas desde Claude o Telegram." />` instead of the list; "Añadir receta" stays disabled.
- If `applied !== ""` and no recipe matches, render `<EmptyState emoji="🔎" title="Sin resultados" hint="Prueba con otra búsqueda." action={<Button variant="secondary" onClick={clearSearch}>Borrar búsqueda</Button>} />`; `selected` is kept.
- If `applied === ""`, list all recipes (nothing is filtered, no message for fewer than 3 characters).
- If `applied !== ""`, list recipes whose title contains every word of `applied`, ignoring case and accents (the matching of `CMP-recipe-search`).
- If `selected === null`, "Añadir receta" is disabled; otherwise enabled.

**Interactions / transitions**

- Tap an option → `selected = id`; tap the selected option → `selected = null`; tap another → moves the selection.
- Type in the search box → `typed` updates; after 1000 ms (or Enter) `applied` is set if `typed.trim().length >= 3`, else `""`.
- Tap "x" of the search box, or Esc with text → `typed = ""`, `applied = ""` at once, focus returns to the box (Esc with no text closes the sheet).
- Tap "Añadir receta" → `confirmAdd()`: (1) compute `missing = missingIngredients(recipe, pantryShown)` (FR-13); (2) append `plan.addRecipe { date, meal, recipe }` to the outbox and show the recipe at the end of the slot; (3) announce "<título> añadida a <desayuno|almuerzo|cena>"; (4) close the picker; (5) if `missing.length > 0`, set `missing`; (6) if `!keyStored` and the key dialog was not dismissed and nothing else is open, open `<KeyDialog>`; (7) try to send the outbox.
- Tap close, press Esc or tap the backdrop → `picker = null`, nothing is added.
- Resizing across 640 px while open → the sheet becomes a modal (or vice versa) keeping `typed`, `applied` and `selected`.

### 2.5. Missing ingredients (`MissingIngredientsSheet`)

- **Platform**: Web. **Divergence by layout**: bottom sheet on `small`; centered modal (max width 520 px) on `medium` and `large`.
- **Purpose**: tell which ingredients of the added recipe are not at home and offer to put them on the shopping list.
- **Route / entry point**: opens after "Añadir receta" when `missing.length > 0`.

**Data required**

| Field | Type | Source |
|---|---|---|
| `missing.recipe` | recipe id | `PlanScreen` state |
| `missing.ingredients` | ingredient ids (catalog), each once | `missingIngredients(recipe, pantryShown)`: lines that reference a catalog ingredient with `staple !== true` and not in `pantryShown.have`; optional lines included; lines without a catalog ingredient ignored |

**Component tree**

- `<Sheet open hideClose title={recipe.title} subtitle="Añadida al plan" onClose={continueWithout}>` (reused, `components/overlays/Sheet`; `hideClose` removes the close button, Esc and backdrop still close)
  - `<MissingIngredientsSheet>` (**NEW**, `components/plan/MissingIngredientsSheet`) content:
    - `<p>` "En tu despensa te faltan estos ingredientes:" (`color.text.muted`)
    - `<ul>` one `<li>` per ingredient, catalog name capitalized, `label` weight 600, 10 px vertical padding, bottom border `color.border`
    - Buttons: `<Button variant="secondary" onClick={continueWithout}>Continuar</Button>` and `<Button variant="primary" onClick={addToList}>Añadir a mi lista de la compra</Button>`; on `small` stacked, primary on top; on `medium` and `large` side by side, equal width

**Conditional rendering states**

- If `missing.ingredients.length > 6`, the list area scrolls (max height such that both buttons stay visible).
- No other state: the sheet is only rendered when `missing !== null`.

**Interactions / transitions**

- Tap "Continuar", press Esc or tap the backdrop → `missing = null`; the shopping list is not changed; then, if `!keyStored` and not dismissed, open `<KeyDialog>`.
- Tap "Añadir a mi lista de la compra" → one `pantry.setBuy { ingredient, value: true }` per ingredient is appended to the outbox after the plan operation (ingredients already on the list stay on); announce "Ingredientes añadidos a tu lista de la compra"; `missing = null`; then the key rule above.
- The recipe stays in the plan in every case.

### 2.6. Write key dialog (`KeyDialog`) and saving

- Reused unchanged from the `007` UX Flow (2.4 and 2.5 there): asked once per device at the first change made, never at launch; "Ahora no" keeps the changes pending; a rejected key asks again and changes stay pending.
- **Order rule of this feature**: while `picker` or `missing` is open, `KeyDialog` is not opened; it opens right after both are closed if the key is still missing, changes are pending and it was not dismissed.
- Plan and pantry operations of one action travel in order in the same outbox; the server writes the pantry first and the plan last (ADR 003); each shows its own pending or failed state in `<TmpPendingChanges>`.

## 3. Navigation Map

```
/plan (SCR-plan)
 ├─ small: PlanDayList ── end of scroll ──> +7 days (same screen)
 ├─ medium/large: PlanWeek ── Semana siguiente/anterior ──> another week (same screen)
 ├─ "Añadir" ──> RecipePickerSheet
 │     ├─ close / Esc / backdrop ──> SCR-plan (nothing added)
 │     └─ "Añadir receta" ──> SCR-plan
 │           ├─ no missing ingredients ──> (key dialog if needed)
 │           └─ missing ingredients ──> MissingIngredientsSheet
 │                 ├─ "Continuar" / Esc / backdrop ──> SCR-plan
 │                 └─ "Añadir a mi lista de la compra" ──> SCR-plan
 ├─ X on a recipe ──> SCR-plan (recipe removed)
 ├─ tap a recipe ──> DetailLayer (feature 002) ──> close ──> SCR-plan
 ├─ plan file unavailable ──> EmptyState with "Reintentar"
 ├─ loading ──> skeleton days
 ├─ offline / no key ──> pending changes ──> KeyDialog ──> sent on reconnection
 └─ server rejects a change ──> change reverted + Toast
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `library.recipes[]` (`id`, `title`, `category`, `time`, `ingredients`, `photoVersion`) | recipes | `GET /api/snapshot` via `useLibrary()` |
| `library.ingredients` (`name`, `staple`) | catalog | `GET /api/snapshot` |
| `library.pantry` (`have`, `to_buy` ids) | pantry | `GET /api/snapshot` |
| `library.plan` (days from today, `updated`) | plan | `GET /api/snapshot` (absent if `plan/plan.yaml` is missing) |
| `pending[]` | plan and pantry operations | outbox (`lib/offline`) |
| `planShown`, `pantryShown` | derived | pure domain functions over `library` and `pending` |
| `keyStored`, `isOnline`, `today` | device state | preference, `navigator.onLine`, local date |
| `visibleDays`, `weekOffset`, `picker`, `missing`, `toast`, `keyDialogOpen` | UI state | local state of `PlanScreen` |
| Write: `plan.addRecipe` / `plan.removeRecipe` `{ id, kind, date, meal, recipe }`, `pantry.setBuy` `{ id, kind, ingredient, value }` | operations | `POST /api/ops` (header `x-app-key`) |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `AppFrame`, `BottomNav` / `SideNav` | `components/layout/AppFrame`, `components/navigation/Nav` | 2.1 |
| `SyncBadge` | `components/feedback/SyncBadge` | 2.1 |
| `Toast` | `components/feedback/Toast` | 2.1 |
| `EmptyState` | `components/feedback/EmptyState` | 2.1, 2.4 |
| `TmpPendingChanges` (temporary, from `007`) | `components/feedback/TmpPendingChanges` | 2.1 |
| `KeyDialog` | `components/pantry/KeyDialog` | 2.1, 2.6 |
| `SearchInput` | `components/inputs/SearchInput` | 2.4 |
| `Button` | `components/inputs/Button` | 2.1, 2.4, 2.5 |
| `RecipePhoto` | `components/recipes/RecipePhoto` | 2.2.1, 2.4 |
| `RecipeDetail` (with `DetailLayer`; new props `onClose`, `overlay`) | `components/recipes/detail/RecipeDetail` | 2.1 |
| `Sheet` (registered, **implemented by this feature**) | `components/overlays/Sheet` | 2.4, 2.5 |
| `AppShell` (new prop `wide`) | `components/layout/AppShell` | 2.1 |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `PlanScreen` | Screen assembly of `/plan` and its state | 2.1 | Feature component; goes to the registry as a Data Display assembly |
| `PlanDayList`, `PlanDay` | Vertical day list with loading of 7 more days | 2.2 | |
| `PlanWeek`, `PlanColumn`, `WeekNav` | Monday–Sunday columns with previous/next week | 2.3 | `WeekNav` may be reused by a future calendar |
| `PlanSlot`, `PlanRecipeItem` | A meal slot and a recipe row with remove | 2.2.1 | |
| `RecipePickerSheet` (with `RecipePickerOption`) | Searchable single-select recipe picker in a `Sheet` | 2.4 | Candidate for reuse by "Inspiración" (backlog #5) |
| `MissingIngredientsSheet` | List of missing ingredients with two actions | 2.5 | |
| Loading skeleton | Three pulsing blocks while the library loads | 2.1 | Inline in `PlanScreen`, not a separate component |

All are feature components prefixed by their domain (`Plan…`), registered in `ui_kit_registry.md` when built; none is a `Tmp` of the design system except those already marked above. `KeyDialog` should become a `Sheet` consumer when `Sheet` exists (separate cleanup, not part of this feature).

## 6. Deviations from PRD (Approved)

| PRD said | We shipped instead | Why / who approved |
|---|---|---|
| §9: medium columns about 150 px minimum | 132 px minimum, gap 6 px | At 1280 px with the sidebar expanded (224 px) seven columns only fit at 132 px; approved with the prototype by the user, 2026-10-30 |
| Not stated: `ui_standards.md` §9 says large windows use a side panel for overlays | The picker and the missing-ingredients sheet are centered modals on `medium` and `large` | The user asked for a modal on medium and large; `ui_standards.md` §9 is updated with this exception (see ui_standards §12) |
| Not stated: when the key dialog opens relative to the picker and the missing sheet | The key dialog waits until both are closed | Avoids stacking two sheets; approved with the prototype |
| FR-10: search timing not stated | Picker search applies after 1000 ms of no typing or on Enter, like the other searches | Consistency; approved with the prototype |

## 7. Open Items

None. Resolved while closing the documentation (2026-10-30):
- `ui_kit_registry.md` was corrected to the real code: `Toast` lives at `components/feedback/Toast` and takes only `message`; `SyncBadge` and `EmptyState` props match the implementation.
- `Sheet` registry entry now specifies `subtitle` and `size="tall"`; this feature implements `Sheet` with them.
- Free-text dishes (read-only text) and `snack` meals (preserved, not shown) are decided behavior (PRD §7, 2.2.1), not open questions. If the household starts using them from Claude or Telegram, a new feature defines how to show them.
