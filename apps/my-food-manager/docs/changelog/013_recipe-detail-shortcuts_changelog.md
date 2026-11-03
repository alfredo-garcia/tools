# Changelog: Recipe Detail Shortcuts

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/013-recipe-detail-shortcuts` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require; merge commit `cf5e439f`, confirmed by user on 2026-11-03
> Source PRD: `013_recipe-detail-shortcuts_prd.md`
> Source UX Flow: `013_recipe-detail-shortcuts_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Screen & Flow Index, Writes, Shared Functional Components, Glossary, Recent Changes; domain `recipes`: Overview, SCR-recipe-detail, CMP-favorite-button, new CMP-shopping-list-sheet, new FLW-add-recipe-to-shopping-list; `plan`: SCR-plan, CMP-recipe-picker, CMP-missing-ingredients, FLW-add-recipe-to-plan; new shared CMP-ingredient-groups)
> Date applied: 2026-11-03
> Reviewed and approved by: user ("Aprobado", 2026-11-03)

## Summary

The recipe detail has two contextual buttons. "Añadir a lista de compra" opens a window that sorts the recipe's ingredients into Faltan, En mi lista de la compra and Ya tengo and puts the Faltan ones on the shopping list. "Añadir al plan" takes Al to the Plan, where the first time the picker opens it offers that recipe first, chosen and tagged "Tu receta". The Plan's missing-ingredients sheet uses the same three groups. Por probar recipes can be planned (as already was the case); the recipe of origin is offered even if it is Descartada.

## Added

- **CMP-shopping-list-sheet** and **FLW-add-recipe-to-shopping-list**.
- **CMP-ingredient-groups** (shared by recipes and plan); glossary terms "Faltan / En mi lista de la compra / Ya tengo" and "Receta de origen / Tu receta".
- `DetailShortcuts`, `ShoppingListSheet` and `IngredientGroups` in `ui_kit_registry.md`; backlog item #12 in `product_vision.md`.
- Address `/plan?add=<recipe id>`.

## Modified

- **SCR-recipe-detail**, **CMP-favorite-button** — shortcuts; on small windows the favorite is a labeled full-width button under the rating, stacked with the shortcuts, and the title row keeps only the share icon.
- **SCR-plan**, **CMP-recipe-picker**, **CMP-missing-ingredients**, **FLW-add-recipe-to-plan** — recipe of origin first in the picker; three groups in the sheet after planning (it still opens only when Faltan is not empty). "Faltante" is replaced by the Faltan group, which also excludes what is already on the list.
- **Writes**, **recipes Overview** (it said it wrote nothing to Drive, which has not been true since ratings), **Product Overview (§1)**, **Domain Map**, **Screen & Flow Index**.
- `ui_kit_registry.md`: `RecipeDetail.onAddToPlan`, `RecipePickerSheet.suggestedId`, `MissingIngredientsSheet` (groups), `Sheet.back`, `FavoriteButton.fullWidth`.

## Removed / Deprecated

- None. `missingIngredients` (code) is replaced by `classifyIngredients`; the glossary term "Faltante" is superseded by the group Faltan.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| Two shortcut buttons, full width on small windows | On small windows favorite and both shortcuts are stacked with the same width, and the heart leaves the title row | User, on the prototype (2026-11-03) |
| Modal button "Añadir ingredientes faltantes" (draft wording) | "Añadir a la lista"; the PRD was updated | User, on the prototype (2026-11-03) |
| Picker search with the 3-letter minimum and 1-second delay | Unchanged in the app; the prototype filtered while typing | UX Flow §6 |

## Open Questions / Follow-Ups

- Leaving `/plan?add=…` without opening the picker and coming back with the browser's Back button offers the recipe again.
- Not checked: light theme, rotation between layouts with the window or the picker open, and the large layout beyond a visual pass.
