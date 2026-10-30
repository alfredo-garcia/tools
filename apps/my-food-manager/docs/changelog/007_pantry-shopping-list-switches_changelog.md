# Changelog: Pantry and Shopping List Switches

> Project: `my-food-manager`
> Merged: commit `74b5c88f` into `main` (merge of `my-food-manager/007-pantry-shopping-list-switches`), confirmed by user on 2026-10-30
> Source PRD: `007_pantry-shopping-list-switches_prd.md`
> Source UX Flow: `007_pantry-shopping-list-switches_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Navigation Structure, Screen & Flow Index, Cross-Cutting Concepts, Shared Data Entities, Glossary, Recent Changes; new domain `pantry`; domain `navigation`: SCR-ingredients removed)
> Date applied: 2026-10-30
> Reviewed and approved by: user ("Aprobar todo", 2026-10-30)

## Summary

Despensa now has two tabs, "Despensa" and "Lista de compra", with search, a family filter and two independent switches per ingredient, "Tengo" and "Comprar". Changes are saved to Drive (the first feature that writes) through an offline outbox and a shared write key.

## Added

- **Domain `pantry`** (proposed by the document manager; approved).
- **SCR-ingredients** (replaces the placeholder), **CMP-pantry-list**, **CMP-pending-changes**, **CMP-write-key**, **FLW-flip-switch**, **FLW-enter-write-key**.
- Shared data entity **Pantry** (schema 2) and glossary terms Tengo / Comprar, Staple, Outbox, Write key, Family.

## Modified

- **Product Overview (§1)**, **Navigation Structure (§4)** — Despensa is no longer a placeholder.
- **Cross-Cutting Concepts (§6)** — "Read-only" replaced by "Writes" and "Changes without connection".

## Removed / Deprecated

- **SCR-ingredients placeholder** in domain `navigation`, replaced by the real screen in `pantry`.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| "Comprar" works on every ingredient. | "Comprar" is locked off on staples. | Pantry schema 2 never lists staples; recorded as approved in the UX Flow. |

## Open Questions / Follow-Ups

1. Resolved 2026-10-30: `tech_foundations` re-checked and approved; `tech_standards.md` §9 now says the write key is asked at the first change, and §5 records pantry schema 2.
2. Resolved 2026-10-30: `TmpSwitch`, `TmpSegmentedControl` and `TmpPendingChanges` are registered in `ui_kit_registry.md` as temporary components. `KeyDialog` is an own overlay because `Sheet` is not implemented yet; it should become a `Sheet` then.
3. Saving to Drive was verified by the user. Not verified: offline use on an installed PWA and two devices at once.
4. Sub-addresses for the two tabs under `/ingredients` are undecided.
