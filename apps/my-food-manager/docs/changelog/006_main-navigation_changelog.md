# Changelog: Main Navigation

> Project: `my-food-manager`
> Merged: commit `02dece88` into `main` (merge of `my-food-manager/006-main-navigation`), confirmed by user on 2026-10-29
> Source PRD: `006_main-navigation_prd.md`
> Source UX Flow: `006_main-navigation_ux_flow.md`
> Master doc file(s) touched: `docs/functional-spec.md` (Overview, Domain Map, Navigation Structure, Screen & Flow Index, Cross-Cutting Concepts, Glossary, Recent Changes; new domain `navigation`; domain `library`: SCR-library-list; domain `recipes`: SCR-recipe-detail)
> Date applied: 2026-10-29
> Reviewed and approved by: user (writing authorized in the request; the redline was shown in the closing message)

## Summary

The app now has a main navigation with four sections (Recetas, Plan, Despensa, Perfil): a bottom bar on small windows and a collapsible sidebar from 640 px. Plan, Despensa and Perfil are placeholders. The user-facing name of the app is "My Food".

## Added

- **Domain `navigation`** — new domain for the main navigation and the placeholder sections (proposed by the document manager; the user did not object).
- **CMP-main-navigation** — bottom bar, sidebar, section highlighting, saved sidebar choice.
- **SCR-plan, SCR-ingredients, SCR-profile** — "Próximamente" placeholders at `/plan`, `/ingredients` and `/profile`.
- **FLW-switch-section, FLW-toggle-sidebar**.
- Glossary terms: Section / destination, Bottom bar, Sidebar, Placeholder section. Cross-cutting concept "Navigation everywhere".

## Modified

- **Navigation Structure (§4)** — "There is no persistent navigation yet" → four sections with a bottom bar or sidebar by layout.
- **Product Overview (§1)** — mentions the user-facing name "My Food" and the four sections.
- **SCR-library-list** — now framed by the main navigation; the list returns to its initial state after visiting another section.
- **SCR-recipe-detail** — on small windows the bottom bar is hidden while it is open; on medium and large the sidebar stays visible.

## Removed / Deprecated

None.

## Deviations from PRD Carried Into the Docs

| PRD said | We documented instead | Why / who approved |
|---|---|---|
| PRD §9 did not specify the sidebar's brand row. | The sidebar shows the PWA icon (pot with steam) and the name; the name is "My Food". | UX Flow §6 (icon) and a later user request (name "My Food"), after the PRD was approved. |

## Open Questions / Follow-Ups

1. Resolved 2026-10-29: feature `my-food-manager/005` (recipe search) is now documented in the master doc (see `005_recipe-search_changelog.md`).
2. `ui_standards.md` §9 and the UI kit registry were updated for this feature before the merge, ahead of the usual order.
3. The product vision was revised to v2 (stage 2) and `tech_foundations` is marked "review needed"; the tech-lead should review the standards for plan and pantry data.
4. Despensa will hold two tabs (pantry and shopping list); their sub-addresses under `/ingredients` are undecided.
5. Offline opening of the placeholder addresses relies on precaching and was not verified on an installed PWA.
