# UX Flow: Plan: Eat Out and Delivery

> Project: `my-food-manager`
> Source PRD: `014_plan-eat-out-delivery_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/014_plan-eat-out-delivery/index.html` (clickable; Plan on a phone frame and as a desktop week, light and dark themes, picker with the options row, marks with X, toolbar to reset data and to reject the next change)
> Status: Approved by user on 2026-11-03

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and the registry entries.

## 1. Flow Summary

From the "Añadir" of a slot, Al marks the slot as "Comer fuera" (`eat-out`) or "Pedir a domicilio" (`delivery`) with one tap in the picker, and removes a mark with its X. Marks show first in their slot with their own icon.

- `SCR-plan` → (tap "Añadir" of a slot) → `RecipePickerSheet` with `PlanOutOptions` → (tap "Salir fuera" or "Pedir") → `SCR-plan` with the mark first in the slot, `plan.addOut` queued
- `RecipePickerSheet` → (choose a recipe, tap "Añadir receta") → as today (FLW-add-recipe-to-plan)
- `SCR-plan` → (tap the X of a mark) → `SCR-plan` without it, `plan.removeOut` queued
- Any mark write → `CMP-pending-changes` while it waits; `CMP-write-key` when the device has no key; a rejected change shows the toast "No se pudo guardar <label>"

## 2. Screens

### 2.1. Plan (`SCR-plan`, changed)

- **Platform**: Web. Day list below 640 px, weekly columns from 640 px (`columns === true`), as today.
- **Purpose**: show the marks and let Al remove them.
- **Route / entry point**: `/plan`, as today.

**Data required**

| Field | Type | Source |
|---|---|---|
| `view[date][meal]` | `PlanDish[]`, now `{ recipe } \| { text } \| { out: "eat-out" \| "delivery" }` | `planWithPending(plan, pending, recipeIds)` over `GET /api/snapshot` plus the outbox |
| `OUT_LABELS` | `{ "eat-out": { label: "Comer fuera", option: "Salir fuera", Icon: Utensils }, delivery: { label: "Pedir a domicilio", option: "Pedir", Icon: Bike } }` | constant in `src/lib/domain/plan-view.ts` (labels) and the component (icons) |
| `actions.onRemoveOut(date, meal, out)` | action | enqueues `plan.removeOut` |

**Component tree** (only what changes)

- `<PlanSlot>` (reused: `components/plan/PlanSlot`)
  - `<ul>`: dishes in the order **`out` dishes first, then the rest in file order**
    - for an `out` dish: `<PlanOutItem out={dish.out} past={past} columns={columns} onRemove={() => actions.onRemoveOut(date, meal, dish.out)} />` (**NEW**, see §5)
    - otherwise `<PlanRecipeItem …/>` as today
  - "Añadir" button: rendered when `!past && !slotHasEatOut`
- `<PlanOutItem>` renders an `<li>` with classes `flex items-center gap-1 rounded-sm bg-surface-2 my-0.5` and:
  - day list (`columns === false`): `min-h-14 pl-1.5`; a `size-11 rounded-sm border border-border bg-surface-1 grid place-items-center` box with the icon (`size-5`, `aria-hidden`), then the label (`font-semibold leading-snug`), gap 12 px
  - weekly columns (`columns === true`): `min-h-12 pl-1`; the icon (`size-4`, `aria-hidden`, no box) aligned to the top with `pt-2`, then the label in `text-[13px] font-semibold`, gap 6 px; the label may wrap
  - the X: same button as `PlanRecipeItem` (`size-11`, `X` icon, hover `bg-surface-2 text-danger-500`), `aria-label="Quitar <label>"`, rendered only when `!past`
  - not a button and no detail link

**Conditional rendering states**

- If the slot has an `eat-out` dish, render no "Añadir" button in that slot.
- If `past === true`, render marks without X (the column is dimmed as today).
- If a dish has an `out` value other than `eat-out` or `delivery`, render nothing for it.
- If several `out` dishes are in one slot (files from food-manager), render each with its own X, in file order among themselves, before the other dishes.
- Loading, offline, error and plan-file-missing states are unchanged (no "Añadir", so no options).

**Interactions / transitions**

- Tap the X of a mark → enqueue `{ kind: "plan.removeOut", date, meal, out }`; the mark disappears at once; no confirmation; the "Añadir" reappears if the slot no longer has `eat-out`.
- On a rejected `plan.addOut` → the mark disappears and the toast "No se pudo guardar <label>" shows for 4 s (existing rejection notice). On a rejected `plan.removeOut` → the mark comes back with the same toast.

### 2.2. Recipe picker (`RecipePickerSheet`, changed)

- **Platform**: Web. `Sheet size="tall"`: bottom sheet below 640 px, centered modal from 640 px, as today.
- **Purpose**: add a recipe, or mark the slot as eaten out or ordered in.
- **Route / entry point**: "Añadir" of a slot.

**Data required**

| Field | Type | Source |
|---|---|---|
| `dishes` | `PlanDish[]` of the slot (stored plus pending) | `PlanScreen` passes `view[date][meal]` |
| `onOut(out)` | action | `PlanScreen`: closes the picker and enqueues `plan.addOut` |

**Component tree**

- `<Sheet open size="tall" title="Añadir al desayuno / al almuerzo / a la cena" subtitle={formatDay(date)}>` (reused: `components/overlays/Sheet`)
  - `<PlanOutOptions eatOutDisabled={dishes.length > 0} deliveryDisabled={dishes.some(d => d.out === "delivery")} slotLabel day onChoose={onOut} />` (**NEW**, see §5): a `grid grid-cols-2 gap-2 mb-3` with two `<Button variant="secondary">` (reused: `components/inputs/Button`), `min-h-12`, full width, icon (`Utensils` / `Bike`, `size-5`) before the text "Salir fuera" / "Pedir"; `aria-label="Salir fuera, <slot in lower case>, <day>"` / `"Pedir, …"`; disabled ones use the `Button` disabled style (opacity 0.4, `disabled` attribute)
  - `<SearchInput …/>` and the recipe list, unchanged
  - "Añadir receta", unchanged

**Conditional rendering states**

- If the slot has any dish (recipe, text or `delivery`), "Salir fuera" is disabled.
- If the slot has a `delivery` dish, "Pedir" is disabled.
- If the picker opened with a 013 suggestion, the options row still shows; choosing an option ends the suggestion like any other close.

**Interactions / transitions**

- Tap an enabled option → `onOut(out)`: the picker closes, `{ kind: "plan.addOut", date, meal, out }` is enqueued, the mark shows at once first in the slot. A recipe chosen in the list is ignored. `MissingIngredientsSheet` does not open. If the device has no write key, `CMP-write-key` opens right after the picker closes.
- Tap a disabled option → nothing.
- Esc, backdrop or close button → close, nothing added (unchanged).

## 3. Navigation Map

```
SCR-plan ──"Añadir"──▶ RecipePickerSheet
   ▲                     ├─ "Salir fuera" / "Pedir" ──▶ SCR-plan (+mark) ──[no key]──▶ CMP-write-key
   │                     ├─ recipe + "Añadir receta" ──▶ SCR-plan (+recipe) ──▶ MissingIngredientsSheet? (unchanged)
   │                     └─ Esc / backdrop / close ──▶ SCR-plan (no change)
   ├─ X of a mark ──▶ SCR-plan (−mark)
   └─ server rejects addOut/removeOut ──▶ SCR-plan (change undone) + toast "No se pudo guardar <label>"
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| plan dish `{ out }` | `"eat-out" \| "delivery"` | `GET /api/snapshot` (plan) |
| `plan.addOut` | `{ id, kind, date, meal, out }` | outbox → `POST /api/ops` |
| `plan.removeOut` | `{ id, kind, date, meal, out }` | outbox → `POST /api/ops` |
| `OUT_LABELS` | labels "Comer fuera", "Pedir a domicilio"; options "Salir fuera", "Pedir" | `src/lib/domain/plan-view.ts` |
| per-op result | `applied \| unchanged \| rejected` | `POST /api/ops` response |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `PlanScreen` | `components/plan/PlanScreen` | 2.1, 2.2 |
| `PlanSlot` | `components/plan/PlanSlot` | 2.1 |
| `PlanRecipeItem` | `components/plan/PlanRecipeItem` | 2.1 (unchanged) |
| `RecipePickerSheet` | `components/plan/RecipePickerSheet` | 2.2 |
| `Sheet` | `components/overlays/Sheet` | 2.2 |
| `Button` (`variant="secondary"`) | `components/inputs/Button` | 2.2 |
| `SearchInput` | `components/inputs/SearchInput` | 2.2 (unchanged) |

**New (add to `ui_kit_registry.md` when the feature ships)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `PlanOutItem` (prototype: `TmpPlanOutItem`) | A mark in a slot: icon, label, X | 2.1 | `components/plan/PlanOutItem`; same height and X as `PlanRecipeItem`; `bg-surface-2` row |
| `PlanOutOptions` (prototype: `TmpPlanOutOptions`) | The two-option row in the picker | 2.2 | `components/plan/PlanOutOptions`; two `Button variant="secondary"` |

## 6. Deviations from PRD (Approved)

None. The neutral `surface-2` background for marks fills in the PRD's "soft tinted background". It was chosen so that it does not reuse lime (favorites) or warning (offline/pending), and the user approved it with the prototype.

## 7. Open Items

None.
