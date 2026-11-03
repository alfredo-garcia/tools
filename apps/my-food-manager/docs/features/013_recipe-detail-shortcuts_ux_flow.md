# UX Flow: Recipe Detail Shortcuts

> Project: `my-food-manager`
> Source PRD: `013_recipe-detail-shortcuts_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/013_recipe-detail-shortcuts/index.html` (clickable; screens: Recetas with detail, Plan with picker and missing-ingredients sheet, Despensa as read-only check of the shopping list; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; toolbar for connection, write key and "reject next change")
> Status: Approved by user on 2026-11-03

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and the registry entries.

## 1. Flow Summary

From a recipe detail, Al puts what the recipe lacks on the shopping list, or starts planning the recipe with it already chosen in the Plan's picker. The sheet shown after planning a recipe uses the same three ingredient groups.

- `SCR-recipe-detail` → (tap "Añadir a lista de compra") → `ShoppingListSheet` → (tap "Añadir a la lista") → detail, "Comprar" on for the Faltan group, queued in the outbox
- `ShoppingListSheet` → (tap "Cancelar", "Atrás", Esc or backdrop) → detail, nothing changed
- `SCR-recipe-detail` → (tap "Añadir al plan") → `SCR-plan` carrying the recipe → (tap "Añadir" of a slot) → `RecipePickerSheet` with that recipe first, marked "Tu receta" and chosen → (tap "Añadir receta") → `SCR-plan` with the recipe in the slot → (if Faltan is not empty) `MissingIngredientsSheet` → `SCR-plan`
- Any pantry or plan write → `CMP-pending-changes` while it waits; the write key dialog (`CMP-write-key`) opens after the sheet closes when the device has no key; a rejected change shows the toast "No se pudo guardar <name>"

## 2. Screens

### 2.1. Recipe detail (`SCR-recipe-detail`, changed)

- **Platform**: Web. Layouts as today: small (<640 px) full screen, medium (640–1279 px) modal, large (>=1280 px) side panel. The detail also opens over Perfil, Plan and Despensa.
- **Purpose**: read the recipe and act on it.

**Data required**

| Field | Type | Source |
|---|---|---|
| `recipe` | `Recipe` | as today |
| `onShopping(recipeId)` | action | opens `ShoppingListSheet` for the recipe |
| `onPlan(recipeId)` | action | goes to the Plan with the recipe (section 2.4) |

**Component tree** (only what changes)

- `<RecipeContent>` (reused: `components/recipes/detail/RecipeDetail`) renders `<DetailShortcuts recipeId={recipe.id} />` right after the rating, favorite and share controls, in the same place on every layout:
  - small windows: in the full-screen detail, under the rating row, the stack is, top to bottom: `FavoriteButton` (labeled), "Añadir a lista de compra", "Añadir al plan". The three buttons have the same width, the full content width inside the 16 px side margins (`w-full`), and the share control keeps its current place
  - medium and large windows: a `flex flex-wrap gap-2` row under the existing rating/favorite/share row, in the photo column
- `<DetailShortcuts>` = two `<Button variant="secondary">`, each with a `lucide-react` icon (`ShoppingCart`, `CalendarPlus`) before its label: "Añadir a lista de compra", "Añadir al plan".

**Conditional rendering states**

- Always render both buttons, whatever `recipe.status` is (Probada, Por probar, Descartada, no status).
- Loading, error and not-found states are unchanged.

**Interactions / transitions**

- Tap "Añadir a lista de compra" → `onShopping(recipe.id)`; the detail stays under the sheet.
- Tap "Añadir al plan" → `onPlan(recipe.id)`.

### 2.2. Shopping-list modal (`ShoppingListSheet`, new)

- **Platform**: Web. `Sheet` as registered: bottom sheet below 640 px, centered modal from 640 px. Opens over the detail, in whichever screen the detail is.
- **Purpose**: show where each ingredient of the recipe stands and put the missing ones on the list.

**Data required**

| Field | Type | Source |
|---|---|---|
| `groups` | `{ faltan: string[]; lista: string[]; tengo: string[] }` (catalog ingredient ids) | `classifyIngredients(recipe, library.ingredients, have, toBuy)` in `src/lib/domain`, with the outbox's pending pantry changes applied |
| `name(id)` | `string` | `library.ingredients[id].name`, shown capitalized |

**Component tree**

- `<Sheet open onClose={close} title={recipe.title} subtitle="Lista de compra">`; its close control is the back button, accessible name "Atrás" (`ArrowLeft`)
  - `<IngredientGroups groups={groups} />` (new, shared with section 2.3)
  - actions row: `<Button variant="secondary" onClick={close}>Cancelar</Button>`, `<Button onClick={add} disabled={groups.faltan.length === 0}>Añadir a la lista</Button>`

**Conditional rendering states**

- If `groups.faltan.length > 0`, render the group "Faltan (n)" first.
- If `groups.lista.length > 0`, render "En mi lista de la compra (n)".
- If `groups.tengo.length > 0`, render "Ya tengo (n)"; if it has more than 5 ingredients, render its heading as a toggle button (`aria-expanded`) that starts collapsed.
- A group with no ingredients is not rendered.
- If `groups.faltan.length === 0` and the recipe has catalog ingredients, render the line "No te falta nada: todo está en tu despensa o en tu lista." and disable "Añadir a la lista".
- If the recipe has no ingredient in the catalog, render only "Esta receta no tiene ingredientes del catálogo." and disable "Añadir a la lista".
- If the outbox changes while the sheet is open, the groups and the button state are recomputed.

**Interactions / transitions**

- Tap "Añadir a la lista" → enqueue `pantry.setBuy { ing, value: true }` for each id of `groups.faltan`, close the sheet, return to the detail; if the device has no write key, `CMP-write-key` opens after the sheet is closed; "Ahora no" leaves the changes pending.
- Tap "Cancelar", the back button, Esc or the backdrop → close with no change.
- A rejected change shows the toast "No se pudo guardar <ingredient>" and the ingredient returns to its saved state.

### 2.3. Missing-ingredients sheet (`MissingIngredientsSheet`, changed)

- **Platform**: Web, as today (`Sheet` with `hideClose`).
- **Purpose**: after a recipe is planned, show the same three groups and offer the same action.

**Component tree** (only what changes)

- `<Sheet open hideClose onClose={onContinue} title={recipeTitle} subtitle="Añadida al plan">`
  - paragraph "En tu despensa te faltan estos ingredientes:"
  - `<IngredientGroups groups={groups} />` replacing the single list
  - actions: `<Button variant="secondary" onClick={onContinue}>Continuar</Button>`, `<Button onClick={onAddToList}>Añadir a mi lista de la compra</Button>`

**Conditional rendering states**

- If `groups.faltan.length === 0` after a recipe is planned, do not open the sheet (as today).
- Group rendering as in 2.2 (hidden empty groups, collapsed "Ya tengo" over 5).

**Interactions / transitions**

- "Añadir a mi lista de la compra" → `pantry.setBuy` on for `groups.faltan` only; close. "Continuar", Esc or backdrop → close, list unchanged. The recipe stays in the plan in every case. The write key is asked after the sheet closes.

### 2.4. Plan (`SCR-plan`, changed) and recipe picker (`RecipePickerSheet`, changed)

- **Platform**: Web, all layouts.
- **Purpose**: plan the recipe Al came from with one tap.

**Data required**

| Field | Type | Source |
|---|---|---|
| `suggested` | `string \| undefined` (recipe id) | the `add` parameter of the address, `/plan?add=<recipe-id>`; read once on arrival |
| `pickable` | `Recipe[]` | `withoutDiscarded(recipes)`, as today |

**Component tree** (only what changes)

- `<PlanScreen>` (reused) keeps `suggested` in state. When it opens the picker from any slot's "Añadir", it passes `suggestedId={suggested}` when that id exists in the library, then clears `suggested` and removes `add` from the address (`router.replace("/plan")`). It does so on every first opening, whether the picker ends in "Añadir receta" or in closing.
- If the detail is open over the Plan, "Añadir al plan" closes the layer and sets `suggested` in place, with no navigation.
- `<RecipePickerSheet suggestedId?>` (reused; new optional prop `suggestedId`):
  - initial selection = `suggestedId`
  - list order = the suggested recipe (when it matches the search), then the rest of `recipes` excluding it, in the usual order
  - the suggested recipe is listed even if it is Descartada; every other Descartada recipe stays out (the Plan screen still passes `pickable` for the rest)
  - the suggested row renders the label "Tu receta" next to its title, and the usual chosen style; the label is part of its accessible name

**Conditional rendering states**

- If `suggestedId` is set, render the list as above and enable "Añadir receta".
- If the search does not match the suggested recipe, it leaves the list like any other; when the search is cleared it is first again.
- If `suggestedId` is set but not in the library, behave as the usual picker.
- If a second opening happens, render the usual picker: no label, no choice.
- If the plan file is missing, `SCR-plan` shows its message ("El plan todavía no está disponible en Drive"); there is no picker and `suggested` is dropped.
- Everything else (search, "Sin resultados", "No hay recetas todavía", Esc/backdrop/close adding nothing, resizing across 640 px keeping text and choice) is unchanged.

**Interactions / transitions**

- Tap the chosen row clears the choice; tap another row moves it (as today). "Añadir receta" → enqueue `plan.addRecipe`, close the picker, open `MissingIngredientsSheet` when `groups.faltan` is not empty, then ask the key if needed.

## 3. Navigation Map

```
SCR-recipe-detail ─ "Añadir a lista de compra" ─> ShoppingListSheet ─ "Añadir a la lista" / cancel ─> SCR-recipe-detail
SCR-recipe-detail ─ "Añadir al plan" ─> SCR-plan (/plan?add=<id>) ─ "Añadir" of a slot ─> RecipePickerSheet [Tu receta first, chosen]
RecipePickerSheet ─ "Añadir receta" ─> SCR-plan ─ (Faltan not empty) ─> MissingIngredientsSheet ─> SCR-plan
SCR-plan ─ detail layer ─ "Añadir al plan" ─> SCR-plan (picker suggestion set in place)
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `groups` | `{ faltan, lista, tengo }` | `classifyIngredients` (new, `src/lib/domain`): over the recipe's lines, each catalog ingredient once, in recipe order, optional lines included; Ya tengo = staple or `have`; En mi lista = not Ya tengo and `to_buy`; Faltan = the rest; ingredients outside the catalog are ignored. Replaces `missingIngredients` |
| `have`, `to_buy` | `Set<string>` | `library.pantry` with pending operations (`pantryWithPending`) |
| `suggested` | recipe id | `?add=` of `/plan` |
| `pantry.setBuy` | `{ id, kind, ing, value }` | outbox → `POST /api/ops` (existing) |
| `plan.addRecipe` | `{ id, kind, date, meal, recipe }` | outbox → `POST /api/ops` (existing) |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `RecipeDetail`, `FavoriteButton`, `RatingStars` | `components/recipes/detail/RecipeDetail`, `components/recipes/FavoriteButton`, `components/recipes/RatingStars` | 2.1 |
| `Sheet` | `components/overlays/Sheet` | 2.2, 2.3 |
| `Button` | `components/inputs/Button` | 2.1, 2.2, 2.3 |
| `RecipePickerSheet` (new optional prop `suggestedId`), `MissingIngredientsSheet` (groups instead of a list), `PlanScreen` | `components/plan/RecipePickerSheet`, `components/plan/MissingIngredientsSheet`, `components/plan/PlanScreen` | 2.3, 2.4 |
| `KeyDialog`, `TmpPendingChanges`, `Toast`, `EmptyState` | existing paths | 2.2, 2.3, 2.4 |

**New**

| Component | Import path | Purpose |
|---|---|---|
| `DetailShortcuts` | `components/recipes/detail/DetailShortcuts` | the two contextual buttons of the detail (prototype name `TmpDetailShortcuts`) |
| `ShoppingListSheet` | `components/recipes/detail/ShoppingListSheet` | the modal of 2.2 |
| `IngredientGroups` | `components/pantry/IngredientGroups` | the three groups, shared by 2.2 and 2.3 (prototype name `TmpIngredientGroups`) |

All three are registered in `ui_kit_registry.md` at merge by document-manager. No other temporary component; the toolbar of the prototype is prototype-only.

## 6. Deviations from PRD (Approved)

- On small windows the labeled favorite button, "Añadir a lista de compra" and "Añadir al plan" are stacked and share the same width, the full content width inside the side margins (PRD §9 only asked for the two shortcut buttons at full width).
- The modal's primary button reads "Añadir a la lista" (the PRD drafts said "Añadir ingredientes faltantes"); the PRD was updated.
- The prototype filters the picker as the user types; the app keeps the existing 3-letter minimum and 1-second delay.

## 7. Open Items

- None blocking. The vision backlog gets item #12 and the registry entries above at merge.
