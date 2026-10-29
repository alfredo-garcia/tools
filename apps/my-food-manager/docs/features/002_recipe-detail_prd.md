# PRD: Recipe Detail

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `002_recipe-detail.md`
> Master doc referenced: `docs/functional-spec.md` (domain `library`)
> Status: Approved (2026-10-29); updated 2026-10-29 after the approved prototype (see `002_recipe-detail_ux_flow.md` §6)
> Branch: `my-food-manager/002-recipe-detail`; commits start with `[my-food-manager/002]`

## 1. Summary
Adds the recipe detail view: a read-only screen that opens from the recipe list and shows a recipe's photo, key facts, general info, ingredients, steps and notes, with its own address and back navigation. For Al and his partner, on phone or desktop, online or offline.

## 2. Background & Context
- SCR-library-list shows rows with photo, title and category; rows do nothing on tap. CMP-recipe-photo already provides photo/fallback tile. The snapshot (FLW-first-sync, §6 offline-first) already carries each recipe's ingredients, steps, notes, variations, tags and source, plus the vocabularies (categories, tags, units) and the ingredient catalog. No new data is needed.
- Navigation: there is no persistent nav yet (master doc §4); the detail must work from the current proof list and from the future browse grid.
- Backlog #3 is the prerequisite for picking recipes (#5) and for the shopping list (#7).

## 3. Goals & Success Metrics
- G1: any recipe in the library opens in one tap and shows its full content.
- G2: the detail works fully offline, including when opened from a direct link.
- G3: closing it (button, Esc, back gesture) returns to the list in the same scroll position.
- Metrics (manual, on the real library): detail visible within 300 ms of the tap; airplane-mode open of a previously synced recipe works; back gesture on phone never exits the app from a detail opened from the list.

## 4. Non-Goals / Out of Scope
Carried over from the feature doc: editing, rating, comments, favorites, curated toggle; action buttons (pick, add to shopping list); pantry status and "Pantry" panel; keep-screen-on, step-by-step mode, checking off steps; serving scaling and unit conversion; previous/next navigation; data-quality flags (missing, doubts, curated); filters, search, grid (backlog #2).

Also not included: sharing buttons, printing, text-size controls, showing the recipe's created/updated dates.

## 5. User Stories & Acceptance Criteria

**US-1 Open and close.** As Al, I want to open a recipe from the list and come back to it exactly as I left it.
1. Given the recipe list, when I tap a recipe, then its detail opens.
2. Given a detail opened on a viewport narrower than 1024 px, then it occupies the full screen with a back button at the top; given 1024 px or wider, then it appears as a modal over the list (max width 720 px, centered, per ui_standards §4), with a close button and a dimmed backdrop.
3. Given an open detail, when I use the close/back button, press Esc (modal), click the backdrop (modal) or use the device back gesture, then the detail closes and the list shows at the same scroll position.
4. Given an open detail, then the list behind it does not scroll.

**US-2 Direct address.** As Al, I want each recipe to have its own link.
1. Given an open detail, then the browser address identifies the recipe (`/recipes/<id>`).
2. Given I open that address directly (typed, bookmarked or from the installed app), then the detail opens with the list behind it on desktop, or full screen on mobile.
3. Given a detail opened directly, when I close it, then I land on the recipe list, not outside the app.
4. Given airplane mode and a previously synced library, when I open a recipe address directly, then the detail opens.
5. Given an address for a recipe that is not in the library, then a "Receta no encontrada" state with a "Volver a recetas" action shows.

**US-3 Header.** As Al, I want to recognize the recipe right away.
1. Given a recipe, then the header shows the photo (16:9 on mobile and desktop) and the title.
2. Given a recipe with no photo, then the category fallback tile shows.

**US-4 Sticky header.** As Al, I want to keep my place and the way back while scrolling.
1. Given a mobile detail, when I scroll down until the title leaves the view, then the compact bar at the top (always fixed, with the back button) shows the recipe title.
2. Given the compact bar showing the title, when I scroll back to the top, then the title disappears from the bar and the header shows in full.
3. Given a long title, then the compact bar shows it on one line, truncated.
4. Given the desktop modal, then the title bar with the close button stays visible while the modal body scrolls; the photo and the title scroll away with the body, and the compact title appears in the bar.

**US-5 Sections.** As Al, I want to fold what I'm not reading.
1. Given a detail, then four sections exist in this order: Info general, Ingredientes, Pasos, Notas; each has a title and a chevron, and starts expanded.
2. Given a section, when I tap its title row or chevron, then only that section collapses or expands, and the chevron and the screen-reader state reflect it.
3. Given I close and reopen a recipe, then all sections are expanded again.
4. Given the Notas section has nothing to show (no notes, no variations, no source), then the section is not rendered.

**US-6 Info general.** As Al, I want the recipe's key facts and context together.
1. Given a recipe, then the section shows these rows in this order: Categoría, Tiempo, Dificultad, Raciones, Técnica, Cocina, Dieta, Proteína, Ocasión.
2. Given Categoría, then it shows the category name (vocabulary label); given Técnica, Cocina, Dieta, Proteína or Ocasión, then it shows the tags of that family as chips with vocabulary labels.
3. Given Tiempo, then the row shows the total time (preparation + cooking + resting) formatted "N min" under 60 and "H h M min" from 60; when I tap the row, then it lists Preparación, Cocción and Reposo below it. It is closed by default.
4. Given Dificultad `easy|medium|hard`, then it reads "Fácil", "Media", "Difícil". Given Raciones, then it reads "<qty> <unit label>" (e.g. "12 unidades").
5. Given any value the recipe doesn't have (category, time, difficulty, servings, or any tag family), then its row shows "-"; a missing part of the time breakdown also shows "-". The row is never hidden.
6. Given a tag id not in the vocabulary, then the raw id shows.

**US-7 Ingredients.** As Al, I want the ingredient list laid out as the recipe has it.
1. Given ingredient lines with a `group`, then they appear under a heading per group; lines without a group come first with no heading, then the named groups in order of first appearance.
2. Given a line, then it shows quantity, unit label, ingredient name from the catalog and the note (e.g. "200 g harina, tamizada"). Original units are never converted.
3. Given a line with `to-taste`, `as-needed` or `pinch`, then it shows the unit label without a number ("sal, al gusto"). Given a line with no quantity and a measurable unit, then it shows "-" as quantity.
4. Given `optional: true`, then the line is marked "opcional".
5. Given a line whose `recipe` points to an existing recipe, then the line is a link; tapping it opens that recipe's detail, and the back gesture returns to the previous one.
6. Given a `recipe` that doesn't exist in the library, then the line is plain text.
7. Given an ingredient id not in the catalog, then the raw id shows.
8. Given no ingredient lines, then the section shows "-".

**US-8 Steps.** As Al, I want the steps in order.
1. Given steps, then they show as a numbered list in file order.
2. Given no steps, then the section shows "-".

**US-9 Notes.** As Al, I want the extras.
1. Given notes, variations or source, then the section shows Notas, Variaciones and Fuente blocks for those that exist.
2. Given a source, then its type and author show as text; given a source URL, then it is a link that opens in a new tab.

## 6. Functional Requirements
1. FR-1: Each recipe row in the list is a tappable target (at least 56 px high per ui_standards §8) that opens that recipe's detail.
2. FR-2: The detail has a stable address per recipe id: `/recipes/<id>`.
3. FR-3: Opening the detail from within the app adds a history entry and closing it removes it; closing a detail that was opened directly replaces the address with the list address.
4. FR-4: Layout switches at 1024 px: full screen below, modal at or above.
5. FR-5: The detail reads exclusively from the stored library on the device; it never waits for the network and never triggers a sync by itself.
6. FR-6: When a sync updates the library while a detail is open, the content updates in place without closing the detail or resetting scroll or section state; if the recipe disappears, the "Receta no encontrada" state shows.
7. FR-7: Section titles, row labels and states use the Spanish copy in §9.
8. FR-8: Total time = prep + cook + rest, treating missing parts as 0; if all three are missing, "-".
9. FR-9: Section collapse state lives only in the open detail.
10. FR-10: Photos use CMP-recipe-photo (online/offline behavior unchanged), at 16:9 in the detail.
11. FR-11: The modal traps focus, restores focus to the tapped row on close, and the page behind is inert. On mobile, the back button is the first focusable element.
12. FR-12: Respects `prefers-reduced-motion` for open/close and collapse animations.

## 7. Data Model / Schema Changes
None. All content comes from the existing snapshot (recipes, ingredient catalog, vocabularies for categories, tags and units). No new fields, no writes.

## 8. API / Interface Contracts
No new endpoints. Reads only from the on-device library and, for the photo, the existing `GET /api/photo/[id]` via CMP-recipe-photo. New page address: `/recipes/<id>` (FR-2).

## 9. UI/UX Requirements
- **Surfaces:** new screen SCR-recipe-detail (mobile full screen, desktop modal). Builds on ui_standards (detail max width 720 px, 44 px touch targets, light/dark tokens) and the kit (`Chip`, `Sheet`/modal variant, `RecipePhoto`); any new component (e.g. collapsible section with chevron, compact header) is defined by ux-designer in the UX Flow.
- **Copy (Spanish):** sections "Info general", "Ingredientes", "Pasos", "Notas"; row labels "Categoría", "Tiempo", "Dificultad", "Raciones", "Técnica", "Cocina", "Dieta", "Proteína", "Ocasión"; time breakdown "Preparación", "Cocción", "Reposo"; notes blocks "Notas", "Variaciones", "Fuente"; difficulty "Fácil/Media/Difícil"; "opcional"; back "Atrás"; close "Cerrar"; "Receta no encontrada" / "Volver a recetas".
- **States:** loading (library still hydrating: "Cargando tu receta…"), success, not found, and partial data ("-" per missing fact).
- **Accessibility:** section headers are buttons with `aria-expanded`; icon-only buttons have `aria-label`; the time group is a disclosure; contrast and focus ring per ui_standards §8.

## 10. Edge Cases & Error Handling
- Library not yet loaded (cold open of a direct address): loading state, then the detail or "not found".
- No library at all and offline on a direct address: same "Necesitas conexión la primera vez" state as SCR-library-list.
- Recipe skipped as invalid: it isn't in the library, so it counts as not found.
- Cyclic recipe links (A links to B, B links to A): allowed; each tap adds a history entry.
- Very long titles, group names, notes or step texts wrap; they never break the layout or overflow horizontally.
- Very long recipes (50+ ingredients or steps): the sticky bar and scrolling stay smooth.
- Quantities with decimals show with a Spanish decimal comma and at most 2 decimals (0,5; 1,25), without fraction glyphs.
- A group with a single line, or a line whose group is an empty string: an empty group is treated as ungrouped.
- Device rotation or window resize across 1024 px with a detail open: the layout switches without closing it or resetting scroll and sections.
- Browser can't store data (private mode): works for the in-memory library only, with the same notice as the list.
- Back gesture while the time group is open: closes the detail (the group is not a navigation state).
- Photo fails to load: fallback tile, never a broken image.

## 11. Non-Functional Requirements
- Performance: open within 300 ms from a stored library; smooth scrolling on a mid-range phone with 100-line recipes.
- Offline: fully functional offline for any synced recipe.
- Accessibility: WCAG AA, keyboard-complete (Tab, Enter/Space on sections, Esc to close the modal), screen-reader names for all controls.
- Security: not applicable; no secret or personal data involved and no new endpoint.
- Scale: designed for 100+ recipes; no pagination.

## 12. Dependencies & Existing System Touchpoints
- Depends on: SCR-library-list (modified: rows become links), CMP-recipe-photo, CMP-app-shell, the library snapshot and vocabularies (FLW-first-sync, FLW-library-refresh), and the service worker, so recipe addresses open offline (this extends the offline behavior from feature `my-food-manager/001`).
- Modifies: SCR-library-list (adds navigation); master doc §4 Navigation Structure.
- Blocks / enables: backlog #5 (pick recipes) and #8 (reviews) will add actions to this screen; backlog #2 (browse) will open it from the grid.
- Stack: nothing outside tech_standards §2.

## 13. Assumptions & Open Questions
- Assumption: "Tipo" in the header means the recipe category.
- Assumption: servings units `people`, `units` and `portions` are not in the units vocabulary; the app maps them to "personas", "unidades" and "porciones".
- Assumption: Notas groups notes, variations and source in one section; the recipe's data-quality flags are intentionally hidden and "-" is the only signal for missing facts.
- Assumption: the service worker can serve the app for `/recipes/<id>` offline; if it requires changes to feature 001's behavior, implementation flags it.
- Deferred ideas (not in this feature): a "Cook" feature (keep screen on, step-by-step, checking steps); a "Pantry" panel on the recipe with "add to shopping list" once pantry and shopping list exist; a view for recipe data quality (missing, doubts, curated).
- Open: none.

## 14. Rollout & Testing Considerations
- No flag or migration. Deploys with the next merge to `main`.
- Unit tests (vitest) for pure logic in `src/lib/domain`: total time, time/servings/difficulty formatting, quantity formatting, ingredient-line formatting for each unit kind, ingredient grouping order, tag-family resolution with unknown ids, resolving linked recipes. Checked against the real sample recipes.
- Manual: phone-sized and desktop viewports, airplane mode, direct address, back gesture, a recipe with groups, a recipe without photo, a recipe with no steps.

## 15. Appendix
- Glossary: **Detail** = this screen; **Compact bar** = the shrunken header on mobile; **Group** = the ingredient `group` field.
- References: master doc `library` domain (SCR-library-list, CMP-recipe-photo, CMP-app-shell), product_vision §5/§7 #3, ui_standards §8-§9, `food/_system/schema.md` recipes schema 3.
