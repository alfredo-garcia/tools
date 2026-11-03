# Changelog: Plan: Eat Out and Delivery

> Project: `my-food-manager`
> Merged: documented on the feature branch `my-food-manager/014-plan-eat-out-delivery` before the merge, as `CLAUDE.md` and `tech_standards.md` §11 require; merge commit `caa27006`, merged and pushed at the user's request on 2026-11-03
> Source PRD: `014_plan-eat-out-delivery_prd.md`
> Source UX Flow: `014_plan-eat-out-delivery_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Product Overview, Domain Map, Screen & Flow Index, Writes, Plan entity, Glossary, Recent Changes; domain `plan`: Overview, SCR-plan, CMP-plan-calendar, CMP-recipe-picker, FLW-add-recipe-to-plan, new FLW-mark-plan-out); `docs/context/ui_kit_registry.md`
> Date applied: 2026-11-03
> Reviewed and approved by: user ("aprobado todo", 2026-11-03)

## Summary

A Plan slot can be marked from the recipe picker as eaten out ("Salir fuera", saved as `eat-out`, shown as "Comer fuera") or ordered in ("Pedir", saved as `delivery`, shown as "Pedir a domicilio"). Marks show first in the slot with their own icon, are removed with the X, are saved to Drive through the outbox and never touch the pantry. Comer fuera takes the whole slot; Pedir a domicilio can share it with recipes, once.

## Added

- **FLW-mark-plan-out** — mark or unmark a slot as eaten out or ordered in.
- Glossary term "Mark / Comer fuera / Pedir a domicilio".
- `PlanOutItem` and `PlanOutOptions` in `ui_kit_registry.md`.
- Operations `plan.addOut` and `plan.removeOut` (ADR 005).

## Modified

- **Plan entity (§8)** — dishes may be `{ out }`; the app now writes marks too, with the rules applied per slot (ADR 005, after the food-manager schema update of 2026-11-03).
- **SCR-plan**, **CMP-plan-calendar** — marks first in the slot; no "Añadir" with Comer fuera; X names for marks.
- **CMP-recipe-picker** — the "Salir fuera" / "Pedir" row above the search, with its disabled rules.
- **FLW-add-recipe-to-plan** — a recipe is rejected in a slot that has Comer fuera.
- **Product Overview**, **Domain Map**, **Screen & Flow Index**, **Writes**.
- `ui_kit_registry.md`: `PlanSlot` / `PlanActions.onRemoveOut`, `RecipePickerSheet` (`dishes`, `onOut`).

## Removed / Deprecated

- None.

## Deviations from PRD Carried Into the Docs

None. The marks' neutral `surface-2` background fills in the PRD's "soft tinted background" (UX Flow §6), so it doesn't reuse lime (favorites) or warning (offline/pending).

## Open Questions / Follow-Ups

- `product_vision.md` §7 still lists backlog item #6 (Plan) as Pending, though it shipped in `my-food-manager/008` and is extended here. Owner: product-manager.
- Not checked against the live Drive: a real write of a mark (the dev-server check ran without a write key; server rules are covered by unit tests).
