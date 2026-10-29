# My Food Manager — Master Functional Documentation

> Project: `my-food-manager`

> Entry point. While the product is small, this file contains everything inline, using the
> domain structure repeated under `##` headers. As domains grow, they move to their own
> files under `docs/functional/domains/` and this file becomes a map plus the shared reference.

## 1. Product Overview

My Food Manager is a personal, visual, mobile-first web app (installable PWA) that helps Al and his household partner decide what to cook and shop without forgetting anything. It reads the Google Drive folder `food`, which the food-manager skill maintains, and keeps working without a connection. There are no logins. Platform: web only.

Today the app lets you browse the library with filters and open each recipe's detail. Pantry, shopping list, picks and reviews are the next features (see `product/product_vision.md` §7).

## 2. How to Read This Documentation

- **ID scheme:** `SCR-` for screens, `FLW-` for flows, `CMP-` for functionally-significant components.
- **Platform notation:** every screen states its platform. A "Platform divergence" note appears only where behavior differs.
- **Source:** every entry names where it came from (feature PRD, and UX Flow when one exists).
- **Scope:** this document describes what the product does and why. Visual specs live in `context/ui_standards.md` and `context/ui_kit_registry.md` and are only referenced here.

## 3. Domain Map

| Domain | One-line description | File | Status |
|---|---|---|---|
| library | Library sync, offline storage and the recipe list | inline below | Active |
| recipes | Filtering the recipe list and reading a recipe | inline below | Active |

## 4. Navigation Structure

There is no persistent navigation yet. The app has the recipe list at `/` and the recipe detail at `/recipes/<id>`. The screen adapts to the window width in three layouts: small (under 640 px), medium (640 to 1279 px) and large (1280 px and above). In small and medium the detail opens over the list; in large the list is a column and the detail opens beside it. The bottom bar and the sidebar are still to come.

## 5. Screen & Flow Index

**Screens**

| ID | Name | Domain | Platform |
|---|---|---|---|
| SCR-library-list | Recipe list | library | Web |
| SCR-recipe-detail | Recipe detail | recipes | Web |

**Flows**

| ID | Name | Domain(s) | Platform |
|---|---|---|---|
| FLW-first-sync | First load | library | Web |
| FLW-library-refresh | Keeping the library fresh | library | Web |
| FLW-filter-recipes | Filter the list | recipes | Web |
| FLW-open-recipe | Open and close a recipe | recipes | Web |

## 6. Cross-Cutting Concepts

- **Read-only.** The app writes nothing to Drive. Writes arrive with the pantry and reviews features.
- **Offline-first.** After the first sync, the library is always shown from the device, before any network response. Reads are never blocked by a missing connection.
- **Freshness.** A sync runs on app open, every 5 minutes while the app is visible and online, within 5 seconds of regaining a connection, and on a manual request. If Drive has no changes, only the "last synced" time updates. A failed sync leaves the stored data untouched.
- **Invalid data.** A malformed recipe file is skipped and counted as a warning. It never breaks the rest of the library.
- **Access.** No login. Read endpoints are open, which is accepted for low-sensitivity personal data.
- **Browsing works from the device.** Filtering and the recipe detail read only the stored library, so they work offline and never wait for the network.

## 7. Shared Functional Components

None shared across domains yet.

## 8. Shared Data Entities

- **Library snapshot.** The complete normalized copy of the `food` folder: recipes (with steps, notes and variations), the ingredient catalog, the pantry, each person's reviews, the vocabularies (categories, tags, units, families) and the list of household people. The people are derived from the review files that exist. The snapshot is replaced as a whole on every sync that finds changes.

## 9. Cross-Domain Flows

None.

## 10. Global Glossary

- **Snapshot:** the normalized library.
- **Fallback tile:** the category-colored tile shown when a recipe has no photo.
- **Detail:** the recipe screen: a full screen on small windows, a modal on medium ones and a panel beside the list on large ones.
- **Column / Panel:** in the large layout, the list on the left and the detail on the right.
- **Compact bar:** the fixed top bar of the detail on small windows, which shows the recipe title once the title scrolls out of view. On medium and large windows the bar always shows the title.
- **Info general:** the first section of the detail, with the recipe's key facts and tags.
- **Total time:** preparation + cooking + resting minutes of a recipe, counting missing parts as 0; used by the Tiempo filter.
- **Filter:** one of Categoría, Tiempo, Dieta, Cocina, Dificultad or Proteína; each holds one chosen value at a time.

## 11. Recent Changes

- 2026-10-29 — library: Drive sync and offline library (see `changelog/001_drive-sync-offline-library_changelog.md`).
- 2026-10-29 — recipes: recipe filters on the list (see `changelog/003_recipe-filters_changelog.md`).
- 2026-10-29 — recipes: recipe detail (see `changelog/002_recipe-detail_changelog.md`).
- 2026-10-29 — recipes: responsive layout, with the list as a column and the detail as a side panel on large windows (see `changelog/004_responsive-recipe-layout_changelog.md`).

---

## Domain: library

### Overview

How data travels from Drive to the device, and how its state is shown. It is the base for every other feature.

### Screens / Pages

#### SCR-library-list Recipe list

- **Platform:** Web
- **Platform divergence:** on large windows (1280 px and above) the list is a 400 px column on the left with its own scroll, and the title, sync badge, refresh button, filters and rows scroll together inside it; the open recipe's row is highlighted. Below 1280 px it is a single page as before. In both cases the filters wrap onto several lines instead of scrolling sideways.
- **Purpose:** browse the library and open a recipe. Rows open SCR-recipe-detail.
- **Entry points:** opening the app (`/`); FLW-first-sync.
- **Functional composition:** CMP-app-shell, CMP-sync-badge, CMP-recipe-photo, CMP-recipe-filters.
- **Data & business rules:** lists recipes alphabetically by title (Spanish collation). Each row shows the photo or fallback tile, the title and the category name, and opens the recipe's detail (rows are at least 56 px high). Above the list are six filters (see CMP-recipe-filters) and, when any is active, "N de M recetas" and "Limpiar". "N con avisos" shows when there are warnings. There is no text search or sort. If the browser cannot store data, a notice says that offline only shows what is already loaded.
- **States (business meaning):**
  - Loading: no stored library and the first sync is running; "Cargando tus recetas…".
  - Offline with no data: "Necesitas conexión la primera vez", with a "Reintentar" button.
  - Error with no data: "No se pudo cargar tu biblioteca", with a "Reintentar" button.
  - Empty: a stored library with no recipes; "No hay recetas todavía".
  - List: the stored library is shown immediately, online or offline.
  - No results: the active filters match nothing; "Ninguna receta coincide" with a "Quitar filtros" button.
- **Related flows:** FLW-first-sync, FLW-library-refresh, FLW-filter-recipes, FLW-open-recipe.
- **Source:** `001_drive-sync-offline-library_prd.md` (no UX Flow exists for that feature), `003_recipe-filters_prd.md` / `_ux_flow.md`, `002_recipe-detail_prd.md` / `_ux_flow.md`, `004_responsive-recipe-layout_prd.md` / `_ux_flow.md`; implementation in `src/components/recipes/RecipeLibrary.tsx`.

### Functionally-Significant Components

#### CMP-sync-badge Sync status badge

- **Design system reference:** `SyncBadge`, `components/feedback/SyncBadge` (see `context/ui_kit_registry.md`).
- **Functional role:** always-visible sync status, announced to screen readers.
- **Behavior rules:** "Sincronizando…", "Sincronizado · hace N min", "Sin conexión · hace N min" and "No se pudo sincronizar". With no sync yet it reads "Sin sincronizar". The elapsed time refreshes every 30 seconds.
- **Used on:** SCR-library-list.
- **Source:** `001_drive-sync-offline-library_prd.md`; implementation in `src/components/feedback/SyncBadge.tsx`.

#### CMP-recipe-photo Recipe photo

- **Design system reference:** `RecipePhoto`, `components/recipes/RecipePhoto` (see `context/ui_kit_registry.md`).
- **Functional role:** shows the recipe photo. With no photo, or if it cannot be loaded, it shows the category fallback tile with its emoji, never a broken image.
- **Behavior rules:** a photo seen once is stored on the device (up to 200) and shows offline. A photo not yet seen shows the fallback tile while offline. The photo is renewed when it changes in Drive.
- **Used on:** SCR-library-list, SCR-recipe-detail (16:9 in the detail).
- **Source:** `001_drive-sync-offline-library_prd.md`; `002_recipe-detail_prd.md`; implementation in `src/components/recipes/RecipePhoto.tsx`.

#### CMP-app-shell Page frame

- **Design system reference:** `AppShell`, `components/layout/AppShell` (see `context/ui_kit_registry.md`).
- **Functional role:** page frame with the title, the sync badge and the refresh control.
- **Behavior rules:** the refresh button is always available and is disabled while a sync runs. On touch devices, pulling down from the top of the page forces a sync. A failed manual refresh shows a notice and keeps the stored data. Pulling down while scrolling inside the recipe detail does not start a refresh.
- **Used on:** SCR-library-list.
- **Source:** `001_drive-sync-offline-library_prd.md`; implementation in `src/components/layout/AppShell.tsx`.

### Flows

#### FLW-first-sync First load

- **Goal / trigger:** first open on a new device, with no setup and no key.
- **Screens involved (in sequence):** SCR-library-list (loading) → (sync succeeds) → SCR-library-list (list). With no connection: SCR-library-list ("Necesitas conexión la primera vez") → "Reintentar".
- **Business rules governing the flow:** the library is stored on the device when the sync completes. A stored library with a different format version than the app expects is discarded and fetched again; while offline, the old copy is kept and used.
- **Edge cases & error handling:** a folder not shared with the app, a revoked credential or missing configuration make the sync fail with an error and never produce partial data. If the device cannot store data (for example private mode), the app works in memory only and says so.
- **Source:** `001_drive-sync-offline-library_prd.md` (US-1, §10).

#### FLW-library-refresh Keeping the library fresh

- **Goal / trigger:** show new or changed recipes without Al doing anything.
- **Screens involved (in sequence):** SCR-library-list.
- **Business rules governing the flow:** triggers and freshness rules are in §6. Triggers that fire together share a single sync. The list updates in place without losing scroll position. A manual refresh (button or pull down) shows a notice if it fails.
- **Edge cases & error handling:** with the app hidden or offline, no periodic requests are made. A recipe deleted in Drive disappears at the next sync. Two tabs or devices sync independently.
- **Source:** `001_drive-sync-offline-library_prd.md` (US-2 to US-4, §10).

---

## Domain: recipes

### Overview

Filtering the recipe list and reading a recipe. Everything works from the stored library, online or offline, and writes nothing to Drive.

### Screens / Pages

#### SCR-recipe-detail Recipe detail

- **Platform:** Web.
- **Platform divergence:** by window width. Small (under 640 px): a full screen with an "Atrás" button. Medium (640 to 1279 px): a modal (max width 720 px) over the list, with a "Cerrar" button, Esc and a click on the backdrop to close. Large (1280 px and above): a panel on the right of the list column that uses all the width left, with a "Cerrar" button; it is not a modal, so the list stays usable and Esc does nothing. Resizing across a breakpoint keeps the open recipe, its scroll position, its open sections and the open time breakdown.
- **Purpose:** read everything needed to decide on and cook a recipe.
- **Entry points:** a row of SCR-library-list; an ingredient that links to another recipe; opening `/recipes/<id>` directly.
- **Functional composition:** CMP-detail-layer, CMP-recipe-photo, CMP-collapsible-section, CMP-recipe-link.
- **Data & business rules:**
  - The top has the photo (16:9; the category tile when there is none) and the title. On medium and large windows the title is always in the bar at the top of the modal or panel; on small windows it is under the photo. On large windows the photo takes two fifths of the width and Info general sits beside it, in the other three fifths.
  - Four sections, in this order, each open on entry and collapsible on its own (the state is not remembered): Info general, Ingredientes, Pasos, Notas.
  - Info general: Categoría, Tiempo, Dificultad, Raciones, Técnica, Cocina, Dieta, Proteína and Ocasión. Tiempo shows the total (preparation + cooking + resting) as "N min" or "H h M min"; tapping it shows Preparación, Cocción and Reposo. Anything the recipe lacks shows "-" and its row stays. Servings units are fixed: personas, unidades, porciones.
  - Ingredientes: ungrouped lines first, then each named group (for example masa, relleno) in order of first appearance. A line shows quantity, name and note. Mass and volume units are abbreviated (g, kg, ml, l); other units are pluralized by quantity; lines "al gusto", "cantidad suficiente" or "pizca" show no number; a measurable line without quantity shows "-"; optional lines carry an "opcional" tag. A line that points to a recipe in the library is a link that opens its detail.
  - Pasos: numbered, in order. Notas: notes, variations and source (with its link); the section is absent when there is nothing to show. Empty ingredients or steps show "-".
  - On small windows, while scrolling, a fixed bar keeps the back button and shows the title once the title leaves the view.
  - On large windows, with nothing selected the panel shows "Elige una receta" with the hint "Se abrirá aquí, sin perder la lista.".
- **States (business meaning):**
  - Loading: the library is still loading; "Cargando tu receta…".
  - No library and offline, or error: the same messages as the list, with "Reintentar".
  - Not found: "Receta no encontrada" with "Volver a recetas".
  - Recipe: the content described above.
- **Related flows:** FLW-open-recipe.
- **Source:** `002_recipe-detail_prd.md`, `002_recipe-detail_ux_flow.md`, `004_responsive-recipe-layout_prd.md`, `004_responsive-recipe-layout_ux_flow.md`; implementation in `src/components/recipes/detail/`.

### Functionally-Significant Components

#### CMP-recipe-filters Recipe filters

- **Design system reference:** `RecipeFilters`, `components/recipes/RecipeFilters` (see `context/ui_kit_registry.md`).
- **Functional role:** the filter row above the list, its option panel, the count and "Limpiar".
- **Behavior rules:**
  - Six filters, in this order: Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína. A filter shows only its name until a value is chosen; then it shows the value with an "x" that removes it and brings the name back. Opening one filter closes any other; Esc or a tap outside closes the options.
  - One value per filter. Filters combine, so a recipe must match all active ones. With several tags in a family (cuisine, diet, protein), a recipe matches if any of them equals the chosen value.
  - Options are the values present in the library, in vocabulary order (values missing from the vocabulary come last, alphabetically), each with the number of recipes it would give with the other active filters. An option with 0 is disabled; the chosen one never is. A filter with no values in the library is disabled.
  - Tiempo uses total time with four options: "Hasta 15 min", "Hasta 30 min", "Hasta 1 h", "Más de 1 h". Dificultad shows "Fácil", "Media", "Difícil". A recipe with no time or no difficulty never matches those filters when active.
  - Option and chip labels come from the vocabularies with the first letter capitalized; a value missing from the vocabulary shows its id, also capitalized.
  - The count reads "N recetas" with no filter and "N de M recetas" with filters. "Limpiar" clears all filters and appears when two or more are active.
  - The list reorders with animation, which is off when the device asks for reduced motion.
- **Used on:** SCR-library-list.
- **Source:** `003_recipe-filters_prd.md`, `003_recipe-filters_ux_flow.md`; implementation in `src/components/recipes/RecipeFilters.tsx`.

#### CMP-detail-layer Detail layer

- **Design system reference:** `DetailLayer`, `components/overlays/DetailLayer`.
- **Functional role:** shows the recipe detail as a full screen, a modal or a side panel, depending on the window width.
- **Behavior rules:** as a full screen or a modal it closes with the back or close button (the modal also with Esc or the backdrop), locks the page behind it, keeps focus inside and returns focus to the row that opened it on close. As a panel it does none of that: the page is not locked, focus is not trapped and Esc does nothing; closing it empties the panel and returns focus to the row that was selected. Switching between the three never closes the recipe or rebuilds its content.
- **Used on:** SCR-recipe-detail.
- **Source:** `002_recipe-detail_prd.md`, `004_responsive-recipe-layout_prd.md`; implementation in `src/components/overlays/DetailLayer.tsx`.

#### CMP-collapsible-section Collapsible section

- **Design system reference:** `CollapsibleSection`, `components/recipes/detail/CollapsibleSection`.
- **Functional role:** a titled section of the detail that folds and unfolds.
- **Behavior rules:** starts open; folds independently of the others; announced to screen readers as expanded or collapsed.
- **Used on:** SCR-recipe-detail.
- **Source:** `002_recipe-detail_prd.md`; implementation in `src/components/recipes/detail/CollapsibleSection.tsx`.

#### CMP-recipe-link Recipe link

- **Design system reference:** `RecipeLink`, `components/recipes/RecipeLink`.
- **Functional role:** a link to a recipe's detail.
- **Behavior rules:** a normal click opens the detail in place, with no network request; opening it in a new tab or copying the link works as for any link. In the side panel the link of the open recipe is marked as the current one, and choosing another recipe replaces the history entry instead of adding one.
- **Used on:** SCR-library-list, SCR-recipe-detail.
- **Source:** `002_recipe-detail_prd.md`; implementation in `src/components/recipes/RecipeLink.tsx`.

### Flows

#### FLW-open-recipe Open and close a recipe

- **Goal / trigger:** read a recipe and return to where you were.
- **Screens involved (in sequence):** SCR-library-list → SCR-recipe-detail → (back, close, Esc, backdrop or device back gesture) → SCR-library-list.
- **Business rules governing the flow:** each recipe has its own address, `/recipes/<id>`. Opening from the list or from an ingredient link needs no network. Closing goes back one step; a detail opened directly closes to the list, never out of the app. On small and medium windows the list keeps its scroll position and cannot be used while the detail is open. On large windows the list stays usable beside the panel: choosing the first recipe adds a history entry, choosing another one replaces it, an ingredient link adds one, and closing or going back leaves `/` with an empty panel (no recipe is selected on its own). Opening `/recipes/<id>` directly on a large window shows the list with that recipe in the panel.
- **Edge cases & error handling:** an unknown address shows the not-found state. If a sync removes the open recipe, the detail switches to not found. Opening a recipe address directly with no connection works.
- **Source:** `002_recipe-detail_prd.md` (US-1, US-2, §10), `004_responsive-recipe-layout_prd.md` (US-1 to US-7).

#### FLW-filter-recipes Filter the list

- **Goal / trigger:** narrow the list in two taps.
- **Screens involved (in sequence):** SCR-library-list.
- **Business rules governing the flow:** tapping a filter opens its options; choosing one applies it and the filter shows the chosen value with an "x" to remove it. "Limpiar" removes all filters when two or more are active. Time options: hasta 15 min, hasta 30 min, hasta 1 h, más de 1 h, measured on total time. Recipes with no time or difficulty never match those options. Filters are not kept across reloads.
- **Edge cases & error handling:** filters that match nothing show "Ninguna receta coincide" with "Quitar filtros". A sync re-applies the active filters in place.
- **Source:** `003_recipe-filters_prd.md` (US-1 to US-6).
