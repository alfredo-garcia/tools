# Changelog: Meal Plan Calendar

> Project: `my-food-manager`
> Merged: commit `ee95c079` into `main` (merge of `my-food-manager/008-meal-plan-calendar`), confirmed by user on 2026-10-30
> Source PRD: `008_meal-plan-calendar_prd.md`
> Source UX Flow: `008_meal-plan-calendar_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Navigation Structure, Screen & Flow Index, Cross-Cutting Concepts, Shared Data Entities, Glossary, Recent Changes; new domain `plan`; domain `navigation`: SCR-plan placeholder removed, SCR-profile wording)
> Date applied: 2026-10-30
> Reviewed and approved by: user ("Aprobar todo", 2026-10-30)

## Summary

Plan is now the household's meal calendar: from today each day has Desayuno, Almuerzo and Cena slots that hold any number of recipes, added through a searchable picker and removed with an X. Adding a recipe checks the pantry and offers to mark the missing ingredients as "Comprar". The plan is saved to `plan/plan.yaml` through the offline queue and the shared write key. This feature was documented after it was merged; from now on documentation is committed before the merge (`CLAUDE.md`, `tech_standards.md` §11).

## Added

- **Domain `plan`** (proposed by the document manager; approved).
- **SCR-plan** (replaces the placeholder), **CMP-plan-calendar**, **CMP-recipe-picker**, **CMP-missing-ingredients**, **FLW-add-recipe-to-plan**, **FLW-remove-plan-recipe**, **FLW-browse-plan**.
- Shared data entity **Plan** (plan schema 1) and glossary terms Plan, Slot (franja) and Faltante.

## Modified

- **Product Overview (§1)**, **Navigation Structure (§4)** — Plan is no longer a placeholder; only Perfil is.
- **Cross-Cutting Concepts (§6)** — "Writes" now covers the pantry and the plan, and states the write order of a mixed batch (pantry first, plan last).
- **SCR-profile** (navigation) — its description no longer refers to the removed SCR-plan.

## Removed / Deprecated

- **SCR-plan placeholder** in domain `navigation`, replaced by the real screen in `plan`.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| §9: medium columns about 150 px minimum, content max 1180 px | 132 px minimum and the columns share the whole available width | Seven columns only fit at 1280 px with the sidebar expanded at 132 px; the user then asked for no width limit (2026-10-30) |
| `ui_standards.md` §9: side panel for overlays on large windows | The picker and the missing-ingredients sheet are centered modals on medium and large | The user asked for a modal on medium and large; `ui_standards.md` §9 carries the exception |
| Not stated: when the write key dialog opens | It opens after the picker and the missing-ingredients sheet are closed | Avoids stacking sheets; approved with the prototype |
| FR-10: search timing not stated | The picker search applies after 1 s without typing or on Enter | Consistency with the other searches; approved with the prototype |
| US-7.4 (a mixed batch of plan and pantry changes) | The server writes the pantry first and the plan last | A retry after a partial failure then only repeats idempotent pantry changes (ADR 003) |

## Open Questions / Follow-Ups

- A retry after a lost response can add a recipe twice when another server instance answers; the user removes the copy with the X (ADR 003, known limit).
- Not verified against the real Drive folder, nor offline on a production build with the service worker.
- A free-text dish and a snack meal that already exist in `plan/plan.yaml` are shown read-only / not shown; a new feature would define how to create or show them.
- The functional documentation of this feature was written after the merge; from now on it is committed on the feature branch before merging.
