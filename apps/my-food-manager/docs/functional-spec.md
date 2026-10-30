# My Food Manager — Master Functional Documentation

> Project: `my-food-manager`

> Entry point. While the product is small, this file contains everything inline, using the
> domain structure repeated under `##` headers. As domains grow, they move to their own
> files under `docs/functional/domains/` and this file becomes a map plus the shared reference.

## 1. Product Overview

My Food Manager (shown to users as "My Food") is a personal, visual, mobile-first web app (installable PWA) that helps Al and his household partner decide what to cook and shop without forgetting anything. It reads the Google Drive folder `food`, which the food-manager skill maintains, and keeps working without a connection. There are no logins. Platform: web only.

Today the app lets you browse the library with filters and a text search and open each recipe's detail, and it has a main navigation with four sections: Recetas, Plan, Despensa and Perfil. Perfil shows Al's favorite recipes. Recipes can be marked as favorites from the list and from the detail, with a heart; favorites are saved to Drive in the same way as the pantry and the plan. Plan is the household's meal calendar: from today on, each day has Desayuno, Almuerzo and Cena, to which recipes are added and removed, and every recipe added is checked against the pantry, offering to put what is missing on the shopping list. Despensa holds the pantry and the shopping list in two tabs, where each ingredient has two switches, "Tengo" and "Comprar", saved to Drive (also from the device without a connection, with a shared write key). Plan changes are saved to Drive in the same way (offline queue and shared write key). Ratings, comments and the person picker of the profile are still pending (see `product/product_vision.md` §7).

## 2. How to Read This Documentation

- **ID scheme:** `SCR-` for screens, `FLW-` for flows, `CMP-` for functionally-significant components.
- **Platform notation:** every screen states its platform. A "Platform divergence" note appears only where behavior differs.
- **Source:** every entry names where it came from (feature PRD, and UX Flow when one exists).
- **Scope:** this document describes what the product does and why. Visual specs live in `context/ui_standards.md` and `context/ui_kit_registry.md` and are only referenced here.

## 3. Domain Map

| Domain | One-line description | File | Status |
|---|---|---|---|
| library | Library sync, offline storage and the recipe list | inline below | Active |
| recipes | Filtering and searching the recipe list and reading a recipe | inline below | Active |
| navigation | Main navigation between sections and their placeholders | inline below | Active |
| pantry | Pantry and shopping list, with writes to Drive | inline below | Active |
| plan | Meal-plan calendar with recipe picking and a pantry check, with writes to Drive | inline below | Active |
| profile | Perfil: Al's favorite recipes and the heart to mark them, with writes to Drive | inline below | Active |

## 4. Navigation Structure

The app has four sections, always reachable from a main navigation: Recetas (`/`, with the recipe detail at `/recipes/<id>`), Plan (`/plan`), Despensa (`/ingredients`) and Perfil (`/profile`). Perfil shows Al's favorite recipes; Plan shows the meal calendar; Despensa shows the pantry and the shopping list in two tabs. The screen adapts to the window width in three layouts: small (under 640 px), medium (640 to 1279 px) and large (1280 px and above).

- **Small:** a bottom bar with the four sections. It is hidden while a recipe detail is open (the detail is a full screen) and comes back when it closes.
- **Medium and large:** a sidebar on the left with the same four sections, collapsible to icons only or expandable to icons and text. It stays visible when a recipe opens (modal on medium, panel beside the list on large).
- **Recipes:** in small and medium the detail opens over the list; in large the list is a column and the detail opens beside it.
- An address that matches no section shows the standard "page not found" page.

## 5. Screen & Flow Index

**Screens**

| ID | Name | Domain | Platform |
|---|---|---|---|
| SCR-library-list | Recipe list | library | Web |
| SCR-recipe-detail | Recipe detail | recipes | Web |
| SCR-plan | Plan | plan | Web |
| SCR-ingredients | Despensa | pantry | Web |
| SCR-profile | Perfil | profile | Web |

**Flows**

| ID | Name | Domain(s) | Platform |
|---|---|---|---|
| FLW-first-sync | First load | library | Web |
| FLW-library-refresh | Keeping the library fresh | library | Web |
| FLW-filter-recipes | Filter the list | recipes | Web |
| FLW-search-recipes | Search the list | recipes | Web |
| FLW-open-recipe | Open and close a recipe | recipes | Web |
| FLW-switch-section | Switch section | navigation | Web |
| FLW-toggle-sidebar | Collapse or expand the sidebar | navigation | Web |
| FLW-flip-switch | Flip a switch | pantry | Web |
| FLW-enter-write-key | Enter the write key | pantry | Web |
| FLW-add-recipe-to-plan | Add a recipe to the plan | plan | Web |
| FLW-remove-plan-recipe | Remove a recipe from the plan | plan | Web |
| FLW-browse-plan | Browse days and weeks | plan | Web |
| FLW-toggle-favorite | Mark or unmark a favorite | profile, library, recipes | Web |

## 6. Cross-Cutting Concepts

- **Writes.** Only the pantry, the plan and Al's favorites are written to Drive, through operations with an offline queue and a shared household write key (see FLW-flip-switch, FLW-add-recipe-to-plan and FLW-toggle-favorite). Everything else stays read-only; ratings and comments arrive with their own feature. A batch that touches several files is written pantry first, then favorites, then plan last, each file on its own.
- **Changes without connection.** A change shows at once, waits on the device and is sent when the connection returns; it is never lost.
- **Offline-first.** After the first sync, the library is always shown from the device, before any network response. Reads are never blocked by a missing connection.
- **Freshness.** A sync runs on app open, every 5 minutes while the app is visible and online, within 5 seconds of regaining a connection, and on a manual request. If Drive has no changes, only the "last synced" time updates. A failed sync leaves the stored data untouched.
- **Invalid data.** A malformed recipe file is skipped and counted as a warning. It never breaks the rest of the library.
- **Access.** No login. Read endpoints are open, which is accepted for low-sensitivity personal data.
- **Navigation everywhere.** The main navigation frames every screen of every section and works offline: switching section needs no data. Library sync keeps running whatever section is open.
- **Browsing works from the device.** Filtering, searching and the recipe detail read only the stored library, so they work offline and never wait for the network. The search text never leaves the device.

## 7. Shared Functional Components

None shared across domains yet.

## 8. Shared Data Entities

- **Library snapshot.** The complete normalized copy of the `food` folder: recipes (with steps, notes and variations), the ingredient catalog, the pantry, each person's reviews, the vocabularies (categories, tags, units, families) and the list of household people. The people are derived from the review files that exist. The snapshot is replaced as a whole on every sync that finds changes.
- **Plan.** `plan/plan.yaml` (plan schema 1, created by the food-manager skill, never by the app): `updated` plus `days`, a map from date (`YYYY-MM-DD`) to a list of meals `{ slot, label, note, dishes }`, where `slot` is `breakfast`, `lunch`, `snack` or `dinner` and a dish is `{ recipe, servings }` (a recipe id) or `{ text }` (free description). Several meals may share a slot. The app shows and edits only the dishes that are recipes of breakfast, lunch and dinner, and writes only the add or removal of one recipe dish (and `updated`); labels, notes, servings, text dishes and snack meals stay as they are. Past days are never shown; any writer may remove them.
- **Reviews (Al).** `reviews/al.yaml` (reviews schema 1, created by the food-manager skill, never by the app): `user`, `updated`, `favorites` (recipe ids) and `ratings`. The app writes only `favorites` (a recipe is added at the end or removed) and `updated`; ratings, comments and unknown fields stay as they are, and a recipe that does not exist is rejected. Until the person picker exists, the person is always Al; the file of the household partner is neither read for favorites nor written.
- **Pantry.** `pantry/pantry.yaml` (schema 2): `updated` plus `items`, a map from ingredient id to `have` and `to_buy`, for non-staple ingredients only. Staples are never listed and are always available. There are no quantities. The app writes only these two flags (and `updated`); Claude and Telegram write the same file.

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
- **Section / destination:** one of the four options of the main navigation: Recetas, Plan, Despensa or Perfil.
- **Bottom bar:** the navigation on small windows.
- **Sidebar:** the navigation on medium and large windows; collapsed shows only icons, expanded shows icons and text.
- **Placeholder section:** a section with no content yet, which shows its title and "Próximamente" (today none).
- **Favorite (favorita):** a recipe whose id is in `favorites` of Al's reviews file, counting the changes still pending on the device.
- **Heart (corazón):** the control that marks or unmarks a favorite; filled when the recipe is a favorite.
- **Plan:** the household's agenda of recipes per day and meal.
- **Slot (franja):** one meal time of one day: Desayuno, Almuerzo or Cena (the file also knows `snack`, not shown).
- **Faltante:** a non-staple ingredient of a recipe that is not "Tengo"; optional ingredients count.
- **Filter:** one of Categoría, Tiempo, Dieta, Cocina, Dificultad or Proteína; each holds one chosen value at a time.
- **Search / applied text:** the text typed in the search bar is the typed text; the applied text is the trimmed typed text once it has 3 or more characters and 1 second has passed without typing (or Enter was pressed). Only the applied text filters the list.
- **Tengo / Comprar:** the two independent switches of an ingredient: "Tengo" (it is at home, `have`) and "Comprar" (it must be bought, `to_buy`). Any combination is valid.
- **Staple (básico):** an ingredient that is always available (water, salt…); it shows "Tengo" on and locked, "Comprar" off and locked.
- **Outbox (cola de cambios):** the ordered list of changes made on the device that Drive has not confirmed yet.
- **Write key (clave de escritura):** the household's shared key that authorizes writes; asked once per device.
- **Family (familia):** the classification of an ingredient (verdura, lácteo…), used by the Despensa filter.
- **Result group:** one of Recetas (the name matched), Proteína (a protein label matched) or Ingredientes (an ingredient name matched). A recipe appears in every group where it matches.

## 11. Recent Changes

- 2026-10-30 — profile: favorite recipes, with a heart in the list and the detail and a "Recetas favoritas" tab in Perfil, saved to Drive (see `changelog/009_favorites_changelog.md`).
- 2026-10-30 — plan: Plan meal calendar with day list and weekly columns, recipe picker, pantry check on add and writes to Drive (see `changelog/008_meal-plan-calendar_changelog.md`).
- 2026-10-30 — pantry: Despensa with "Despensa" and "Lista de compra" tabs and Tengo/Comprar switches saved to Drive, with an offline queue (see `changelog/007_pantry-shopping-list-switches_changelog.md`).
- 2026-10-29 — recipes: text search on the recipe list, with results grouped by name, protein and ingredient (see `changelog/005_recipe-search_changelog.md`).
- 2026-10-29 — navigation: main navigation with a bottom bar and a collapsible sidebar, and placeholder sections Plan, Despensa and Perfil (see `changelog/006_main-navigation_changelog.md`).
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
- **Platform divergence:** on large windows (1280 px and above) the list is a 400 px column on the left with its own scroll, and the title, sync badge, refresh button, filters and rows scroll together inside it; the open recipe's row is highlighted. Below 1280 px it is a single page as before. In both cases the filters wrap onto several lines instead of scrolling sideways. The main navigation (CMP-main-navigation) frames the list: on large windows the sidebar sits to the left of the column. Navigating to another section and back shows the list in its initial state.
- **Purpose:** browse the library and open a recipe. Rows open SCR-recipe-detail.
- **Entry points:** opening the app (`/`); Recetas in the main navigation; FLW-first-sync.
- **Functional composition:** CMP-app-shell, CMP-sync-badge, CMP-recipe-photo, CMP-recipe-search, CMP-recipe-filters, CMP-favorite-button, CMP-pending-changes.
- **Data & business rules:** lists recipes alphabetically by title (Spanish collation). Each row shows the photo or fallback tile, the title and the category name, and opens the recipe's detail (rows are at least 56 px high). At the right of every row is a heart (CMP-favorite-button) that marks or unmarks the recipe as a favorite without opening it; the row stays where it is and the list does not reorder. "N cambios pendientes" (CMP-pending-changes) shows above the list while changes wait. Under the title is the search bar (see CMP-recipe-search) and below it the six filters (see CMP-recipe-filters). The count line "N de M recetas" and "Limpiar" show when a filter is active, and the count also shows while a search is applied. With an applied search, the list becomes up to three groups of rows (Recetas, Proteína, Ingredientes), each headed by its name and its number of recipes, e.g. "Proteína · 3"; empty groups are not shown, and N counts the different recipes shown. "N con avisos" shows when there are warnings. There is no sort. If the browser cannot store data, a notice says that offline only shows what is already loaded.
- **States (business meaning):**
  - Loading: no stored library and the first sync is running; "Cargando tus recetas…".
  - Offline with no data: "Necesitas conexión la primera vez", with a "Reintentar" button.
  - Error with no data: "No se pudo cargar tu biblioteca", with a "Reintentar" button.
  - Empty: a stored library with no recipes; "No hay recetas todavía".
  - List: the stored library is shown immediately, online or offline.
  - Grouped results: a search is applied and at least one recipe matches; the groups described above.
  - No results: the active filters, or the applied search with the filters, match nothing; "Ninguna receta coincide" with a hint and the buttons that apply: "Borrar búsqueda" when a search is applied and "Quitar filtros" when a filter is active.
- **Related flows:** FLW-first-sync, FLW-library-refresh, FLW-filter-recipes, FLW-search-recipes, FLW-open-recipe, FLW-toggle-favorite.
- **Source:** `001_drive-sync-offline-library_prd.md` (no UX Flow exists for that feature), `003_recipe-filters_prd.md` / `_ux_flow.md`, `002_recipe-detail_prd.md` / `_ux_flow.md`, `004_responsive-recipe-layout_prd.md` / `_ux_flow.md`, `005_recipe-search_prd.md` / `_ux_flow.md`, `009_favorites_prd.md` / `_ux_flow.md`; implementation in `src/components/recipes/RecipeLibrary.tsx` and `src/components/recipes/RecipeRow.tsx`.

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

Filtering and searching the recipe list and reading a recipe. Everything works from the stored library, online or offline, and writes nothing to Drive.

### Screens / Pages

#### SCR-recipe-detail Recipe detail

- **Platform:** Web.
- **Platform divergence:** by window width. Small (under 640 px): a full screen with an "Atrás" button. Medium (640 to 1279 px): a modal (max width 720 px) over the list, with a "Cerrar" button, Esc and a click on the backdrop to close. Large (1280 px and above): a panel on the right of the list column that uses all the width left, with a "Cerrar" button; it is not a modal, so the list stays usable and Esc does nothing. On small windows the bottom bar is hidden while it is open; on medium and large the sidebar stays visible. Resizing across a breakpoint keeps the open recipe, its scroll position, its open sections and the open time breakdown.
- **Purpose:** read everything needed to decide on and cook a recipe.
- **Entry points:** a row of SCR-library-list; an ingredient that links to another recipe; opening `/recipes/<id>` directly.
- **Functional composition:** CMP-detail-layer, CMP-recipe-photo, CMP-collapsible-section, CMP-recipe-link, CMP-favorite-button.
- **Data & business rules:**
  - The top has the photo (16:9; the category tile when there is none) and the title. On medium and large windows the title is always in the bar at the top of the modal or panel; on small windows it is under the photo. On large windows the photo takes two fifths of the width and Info general sits beside it, in the other three fifths.
  - Favorite: on small windows the heart (CMP-favorite-button) takes the right end of the title row and the title wraps in the space left. On medium and large windows a button with the heart and the text "Añadir a favoritos" or "Quitar de favoritos" sits under the photo, with the width of its content; on large windows it is in the photo's column, beside Info general. Tapping it changes the recipe's state at once, also in the list row behind. The detail still has no rating, comment or "curated" control.
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
- **Related flows:** FLW-open-recipe, FLW-toggle-favorite.
- **Source:** `002_recipe-detail_prd.md`, `002_recipe-detail_ux_flow.md`, `004_responsive-recipe-layout_prd.md`, `004_responsive-recipe-layout_ux_flow.md`, `009_favorites_prd.md` / `_ux_flow.md`; implementation in `src/components/recipes/detail/`.

### Functionally-Significant Components

#### CMP-recipe-search Recipe search

- **Design system reference:** `SearchInput`, `components/inputs/SearchInput`; the result headings use the temporary `TmpResultGroup`, `components/recipes/TmpResultGroup` (see `context/ui_kit_registry.md`).
- **Functional role:** the search bar between the "Recetas" title and the filters, and the grouped results it produces.
- **Behavior rules:**
  - Placeholder "Buscar por nombre, proteína o ingrediente". The bar is not shown while the library is loading, empty or failed.
  - With fewer than 3 characters (after trimming) nothing is filtered and no message appears. With 3 or more, the search applies 1 second after the last keystroke; Enter applies it at once. Typing again restarts the wait and the list keeps showing the previous result meanwhile, with no spinner.
  - The "x" at the right of the bar shows only when there is text. It, and Esc inside the bar, erase the text, drop the results at once and return focus to the bar. "Limpiar" and "Quitar filtros" never touch the text, and the search never touches the filters.
  - Three places are searched, in this order: the recipe name ("Recetas"), the protein labels ("Proteína"), and the names of the ingredient lines ("Ingredientes", optional ones included; quantities, units and notes are not searched). The ingredient name comes from the catalog, or from the id with hyphens as spaces if the catalog has none.
  - Case and accents are ignored ("cafe" finds "café") and parts of words match ("pol" finds "Pollo"); "ñ" is a different letter from "n". With several words, all must be found in the same place: in the name, in one protein label, or in the name of one single ingredient.
  - Active filters are applied first and the three groups are computed on what remains. A recipe is listed in every group where it matches. Rows keep the alphabetical order and the same look as the plain list; on large windows the open recipe's row is highlighted in every group.
  - The filters' option counts ignore the search.
  - A sync that updates the library re-applies the search and the filters in place. The text is not saved: reloading, or leaving Recetas and coming back, empties it.
  - Category, cuisine, diet, difficulty, time, steps, notes, comments and sources are not searched; there is no relevance order, highlighting or typo tolerance.
- **Used on:** SCR-library-list.
- **Source:** `005_recipe-search_prd.md`, `005_recipe-search_ux_flow.md`; implementation in `src/components/inputs/SearchInput.tsx`, `src/components/recipes/use-search-query.ts`, `src/components/recipes/RecipeLibrary.tsx` and `src/lib/domain/search.ts`.

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

#### FLW-search-recipes Search the list

- **Goal / trigger:** find a known recipe by a few letters of its name, its protein or an ingredient.
- **Screens involved (in sequence):** SCR-library-list (plain list) → (type 3 or more characters and pause 1 second, or press Enter) → SCR-library-list (grouped results) → (tap "x", press Esc, or delete letters until fewer than 3 remain) → SCR-library-list (plain list).
- **Business rules governing the flow:** see CMP-recipe-search. Search and filters combine and are independent of each other. Opening a recipe from any group keeps the text and the scroll position while the detail is open; on large windows the list stays usable beside the panel.
- **Edge cases & error handling:** text of only spaces counts as fewer than 3 characters. Pasted text applies after the same 1-second wait. Very long text simply matches nothing. Special characters are plain text. If nothing matches, "Ninguna receta coincide" offers "Borrar búsqueda" (and "Quitar filtros" when filters are active). Offline behaves exactly as online, with no request.
- **Source:** `005_recipe-search_prd.md` (US-1 to US-5, §10).

---

## Domain: navigation

### Overview

How the user moves between the sections of the app, and (when there are any) the sections that have no content yet. It writes nothing to Drive and needs no data, so it works offline.

### Screens / Pages

No section is a placeholder today: every section has its own screen.

### Functionally-Significant Components

#### CMP-main-navigation Main navigation

- **Design system reference:** `AppFrame`, `components/layout/AppFrame`; `BottomNav` and `SideNav`, `components/navigation/Nav` (see `context/ui_kit_registry.md`).
- **Functional role:** lets the user go to Recetas, Plan, Despensa or Perfil from any screen, and shows which section is current.
- **Behavior rules:**
  - The four sections are always in this order. The current section is the one whose address matches, including addresses below it; Recetas is current for `/` and for any recipe detail. For an unknown address no section is marked.
  - Below 640 px it is a bottom bar with icon and text; from 640 px it is a sidebar. Crossing 640 px switches between them at once without changing the section or the open recipe.
  - The bottom bar is not shown while a recipe detail is open on a small window.
  - The sidebar can be collapsed (icons only; the names stay available to assistive technology) or expanded. With no saved choice it starts expanded on large windows and collapsed on medium ones. The choice is saved on the device and applies to both sizes; if the browser cannot save it, the default applies and the app works as usual.
  - The sidebar shows the app icon (a pot with steam) and the name "My Food" beside it when expanded.
  - Switching sections does not reload the page and needs no connection.
- **Used on:** every screen.
- **Source:** `006_main-navigation_prd.md` / `_ux_flow.md`; implementation in `src/components/layout/AppFrame.tsx`, `src/components/navigation/Nav.tsx` and `src/lib/domain/navigation.ts`.

### Flows

#### FLW-switch-section Switch section

- **Goal / trigger:** go to another part of the app.
- **Screens involved (in sequence):** any screen → (tap a section in the bottom bar or sidebar) → SCR-library-list, SCR-plan, SCR-ingredients or SCR-profile.
- **Business rules governing the flow:** the tapped section becomes the current one. Browser back and forward follow the address and the current section follows it. Leaving Recetas and coming back shows the list with no filters, no search text and scrolled to the top. Library sync is unaffected.
- **Source:** `006_main-navigation_prd.md` / `_ux_flow.md`.

#### FLW-toggle-sidebar Collapse or expand the sidebar

- **Goal / trigger:** give more room to the content, or show the section names.
- **Screens involved (in sequence):** any screen on a medium or large window → (tap the collapse or expand button at the bottom of the sidebar) → the same screen with the sidebar in the other state.
- **Business rules governing the flow:** the new state is saved on the device and used on the next visit, on both medium and large windows.
- **Source:** `006_main-navigation_prd.md` / `_ux_flow.md`.

---

## Domain: pantry

### Overview

The pantry and the shopping list over the ingredient catalog, with writes to Drive. It is the only part of the app that writes: only `have` and `to_buy` of `pantry/pantry.yaml`. Reading works from the stored library, online or offline.

### Screens / Pages

#### SCR-ingredients Despensa

- **Platform:** Web.
- **Purpose:** record in one tap whether an ingredient is at home and whether it must be bought, and see what is to buy. Address `/ingredients`; the browser tab is titled "Despensa · My Food".
- **Entry points:** Despensa in the main navigation; direct address; "Ir a Despensa" from an empty shopping list.
- **Functional composition:** CMP-main-navigation, CMP-app-shell, CMP-pantry-list, CMP-pending-changes, CMP-write-key.
- **Data & business rules:**
  - Two tabs, "Despensa" and "Lista de compra"; the second shows how many ingredients are marked "Comprar". It opens on "Despensa". Leaving the section or reloading resets the tab, the search and the filters.
  - Tab "Despensa": a Tengo / No tengo / Todos filter ("Tengo" by default). Every ingredient row has two independent switches, "Tengo" and "Comprar"; neither changes the other. An active search ignores the Tengo / No tengo / Todos filter. A row whose "Tengo" changes stays in place until the filter, the search or the tab changes.
  - Tab "Lista de compra": the ingredients with "Comprar" on, with the family filter only. Turning "Comprar" off leaves the row struck through until leaving the tab, so a slip is undone with one tap.
  - Staples are shown with "Tengo" on and locked and "Comprar" off and locked, labelled "Básico, siempre disponible"; the pantry file never lists them.
  - Data: ingredient catalog, family vocabulary and the pantry.
- **States (business meaning):**
  - Loading, no library while offline, and error: as the recipe list, with "Reintentar".
  - No match: "Ningún ingrediente coincide", with "Borrar búsqueda" and/or "Quitar filtros".
  - Empty shopping list: "Tu lista está vacía", with "Ir a Despensa".
- **Related flows:** FLW-flip-switch, FLW-enter-write-key.
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `007_pantry-shopping-list-switches_ux_flow.md`; implementation in `src/components/pantry/` and `src/app/ingredients/page.tsx`.

### Functionally-Significant Components

#### CMP-pantry-list Ingredient search and filters

- **Design system reference:** `SearchInput`, `FilterChip`, `FilterOptions` (see `context/ui_kit_registry.md`); temporary `TmpSwitch` and `TmpSegmentedControl`.
- **Functional role:** the search bar, the family filter and the switch rows of both tabs.
- **Behavior rules:**
  - Search: 3 characters minimum; applies 1 second after the last keystroke or on Enter; "x" and Esc clear it. Case and accents are ignored ("ñ" is a different letter); it searches the name and the synonyms, and with several words all must be in the same name or synonym. The text never leaves the device.
  - Family filter: one family at a time, with the count per option. The options are the families present in the tab's list, in vocabulary order; an ingredient with no family counts under "Otros".
  - Sorted alphabetically (Spanish).
- **Used on:** SCR-ingredients.
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `_ux_flow.md`; implementation in `src/components/pantry/IngredientsScreen.tsx`, `IngredientRow.tsx` and `src/lib/domain/pantry-view.ts`.

#### CMP-pending-changes Pending changes

- **Design system reference:** temporary `TmpPendingChanges`, `components/feedback/TmpPendingChanges`.
- **Functional role:** shows the state of the outbox.
- **Behavior rules:** shows "N cambios pendientes" while any change is unconfirmed; offers "Introducir clave" when the device has no key; when the server rejects a change, the switch returns to the stored value and a 4-second notice says "No se pudo guardar <ingrediente>".
- **Used on:** SCR-ingredients, SCR-plan, SCR-library-list, SCR-profile. A rejected favorite reads "No se pudo guardar <receta>".
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `_ux_flow.md`, `009_favorites_prd.md`; implementation in `src/components/feedback/TmpPendingChanges.tsx`.

#### CMP-write-key Write key dialog

- **Design system reference:** none (own overlay, `KeyDialog`, because the kit has no `Sheet` yet).
- **Functional role:** asks for the household write key.
- **Behavior rules:** asked once per device, at the first change (not at launch). If the server rejects the key it reappears with "La clave no es correcta" and the changes stay pending. "Ahora no" closes it and it does not reopen with further switches until the screen is opened again. Bottom sheet on small windows, centered modal from 640 px.
- **Used on:** SCR-ingredients, SCR-plan and, for favorites, wherever a heart is (SCR-library-list, SCR-recipe-detail, SCR-profile).
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `_ux_flow.md`, `009_favorites_prd.md`; implementation in `src/components/pantry/KeyDialog.tsx` and `src/components/feedback/FavoriteFeedback.tsx`.

### Flows

#### FLW-flip-switch Flip a switch

- **Goal / trigger:** record that an ingredient is at home or must be bought.
- **Screens involved (in sequence):** SCR-ingredients → (flip "Tengo" or "Comprar") → SCR-ingredients with the new value and, until confirmed, CMP-pending-changes.
- **Business rules governing the flow:** the change shows at once and goes to the device's outbox; it is sent as soon as there is a connection and a key. Several changes to the same switch collapse into the last one. Without connection or after a failure it retries after 2, 5, 15 and 60 seconds, then every 60 seconds while the app is visible. The server applies the changes to the latest `pantry.yaml`, retrying once on a conflict, edits only the touched lines and sets `updated` with offset `-05:00`.
- **Edge cases & error handling:** an unknown ingredient, a staple, or a file that is not schema 2 is rejected with a notice, never merged into another format. A Drive outage or a repeated conflict keeps the change pending. The other phone sees the change at its next sync; the last change to an ingredient wins.
- **Source:** `007_pantry-shopping-list-switches_prd.md` (§5, §10).

#### FLW-enter-write-key Enter the write key

- **Goal / trigger:** authorize this device to write (first change, a rejected key, or "Introducir clave").
- **Screens involved (in sequence):** SCR-ingredients → CMP-write-key → SCR-ingredients with the pending changes sent.
- **Business rules governing the flow:** the key is stored on the device; once accepted, pending changes are sent in order.
- **Edge cases & error handling:** a wrong key keeps the dialog open with "La clave no es correcta"; "Ahora no" leaves the changes pending.
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `_ux_flow.md`.

---

## Domain: plan

### Overview

The household's meal calendar. Every day from today has three slots, Desayuno, Almuerzo and Cena, that hold any number of recipes. It writes only the add and removal of recipe dishes in `plan/plan.yaml`; reading works from the stored library, online or offline. Adding a recipe also checks the pantry and can mark what is missing as "Comprar".

### Screens / Pages

#### SCR-plan Plan

- **Platform:** Web. **Platform divergence:** below 640 px the days are a vertical list and the pickers are bottom sheets; from 640 px the days are weekly columns and the pickers are centered modals (also on large windows).
- **Purpose:** decide and see what will be eaten each day, and learn at once which ingredients are missing. Address `/plan`; the browser tab is titled "Plan · My Food".
- **Entry points:** Plan in the main navigation; direct address.
- **Functional composition:** CMP-main-navigation, CMP-app-shell, CMP-plan-calendar, CMP-recipe-picker, CMP-missing-ingredients, CMP-pending-changes, CMP-write-key, CMP-detail-layer (the recipe detail opened over the Plan).
- **Data & business rules:**
  - Shows the days from today (the device's date); a day before today is never shown on small windows, and in the current week of the weekly view it is dimmed, shows its recipes and offers no "Añadir" or X.
  - Each day has the slots Desayuno, Almuerzo and Cena, in that order. A slot holds any number of recipes, the same recipe may repeat, and they appear in the order of the file (all meals of that slot together). Free-text dishes are shown as plain text without photo, X or detail link. Snack meals in the file are kept and not shown. A recipe id that is not in the library is not shown.
  - Small windows: today and the next 7 days (8 days); each time the end of the list is reached 7 more days are added, with no limit, also offline.
  - Medium and large windows: one week, Monday to Sunday, in seven columns that share the available width equally (132 px minimum; if they do not fit, the week scrolls sideways). A title shows the date range, with "Esta semana" for the current week, and today's column is highlighted. Buttons at the sides go to the previous and next week; the previous one is disabled in the current week (a past week cannot be reached) and the next one has no limit.
  - Tapping a recipe opens its detail over the Plan (full screen on small windows, a modal from 640 px) and closing it returns to the same place.
  - Data: recipes, ingredient catalog, pantry and plan from the stored library.
- **States (business meaning):**
  - Loading: placeholder blocks.
  - No library while offline, and error: as the recipe list, with "Reintentar".
  - Plan file missing: "El plan todavía no está disponible en Drive", with "Reintentar" and no way to add or remove.
  - Offline: the stored plan is shown; changes wait on the device (CMP-pending-changes).
  - Empty slot: only its name and "Añadir".
- **Related flows:** FLW-add-recipe-to-plan, FLW-remove-plan-recipe, FLW-browse-plan, FLW-enter-write-key.
- **Source:** `008_meal-plan-calendar_prd.md`, `008_meal-plan-calendar_ux_flow.md`; implementation in `src/components/plan/` and `src/app/plan/page.tsx`.

### Functionally-Significant Components

#### CMP-plan-calendar Day list, weekly columns and slots

- **Design system reference:** `RecipePhoto`, `SyncBadge`, `AppShell` (see `context/ui_kit_registry.md`); `PlanScreen`, `PlanDayList`, `PlanWeek`, `PlanSlot` and `PlanRecipeItem` are registered there.
- **Functional role:** shows the days and their slots and offers "Añadir", the X and the opening of a recipe.
- **Behavior rules:** as the data and business rules of SCR-plan. The X has the accessible name "Quitar <receta>"; "Añadir" names its slot and day.
- **Used on:** SCR-plan.
- **Source:** `008_meal-plan-calendar_prd.md`, `_ux_flow.md`; implementation in `src/components/plan/` and `src/lib/domain/plan-view.ts`, `plan-calendar.ts`.

#### CMP-recipe-picker Recipe picker

- **Design system reference:** `Sheet`, `SearchInput`, `Button`.
- **Functional role:** chooses one recipe for a slot.
- **Behavior rules:**
  - Titled "Añadir al desayuno / almuerzo / a la cena" with the day. A search box ("Buscar receta"), the library list (photo, title, total time) and "Añadir receta".
  - Search: 3 characters minimum, applied 1 second after the last keystroke or on Enter; "x" and Esc clear it. Case and accents are ignored and every word must be in the title. With fewer than 3 characters the whole library shows. No match shows "Sin resultados" and keeps the selection; an empty library shows "No hay recetas todavía".
  - One recipe at a time: tapping another moves the choice, tapping the chosen one clears it. "Añadir receta" is enabled only with a choice.
  - Esc, the backdrop or the close button close it and add nothing. Resizing across 640 px keeps the text and the choice.
- **Used on:** SCR-plan.
- **Source:** `008_meal-plan-calendar_prd.md`, `_ux_flow.md`; implementation in `src/components/plan/RecipePickerSheet.tsx`.

#### CMP-missing-ingredients Missing ingredients

- **Design system reference:** `Sheet` without the close button.
- **Functional role:** after a recipe is added, lists what the pantry lacks for it.
- **Behavior rules:**
  - Opens only when there are faltantes: ingredients of the recipe that are in the catalog, are not staples and are not "Tengo" (optional lines count; each ingredient once). It says "En tu despensa te faltan estos ingredientes:" and lists them.
  - "Continuar" leaves the shopping list as it is. "Añadir a mi lista de la compra" turns "Comprar" on for each of them (those already on stay on).
  - Esc or the backdrop do the same as "Continuar". The recipe stays in the plan in every case. The write key, if needed, is asked after this sheet closes.
- **Used on:** SCR-plan.
- **Source:** `008_meal-plan-calendar_prd.md`, `_ux_flow.md`; implementation in `src/components/plan/MissingIngredientsSheet.tsx` and `src/lib/domain/plan-view.ts`.

### Flows

#### FLW-add-recipe-to-plan Add a recipe to the plan

- **Goal / trigger:** plan a recipe for a slot of a day.
- **Screens involved (in sequence):** SCR-plan → ("Añadir" of a slot) → CMP-recipe-picker → ("Añadir receta") → SCR-plan with the recipe at the end of the slot → (if there are faltantes) CMP-missing-ingredients → SCR-plan → (if the device has no key) CMP-write-key.
- **Business rules governing the flow:** the recipe shows at once and goes to the outbox with the same sending, key and retry rules as FLW-flip-switch. The server applies the change to the latest `plan.yaml`, retrying once on a conflict: the dish goes to the last meal of that slot on that day, or a new meal is created in slot order (breakfast, lunch, snack, dinner); days stay in date order; everything the app does not manage is kept; `updated` is set with offset `-05:00`. In a batch with pantry changes, the pantry is written first and the plan last.
- **Edge cases & error handling:** an unknown recipe, a bad date, a slot other than breakfast, lunch or dinner, or a day earlier than yesterday in `-05:00` is rejected, the recipe leaves the screen and a 4-second notice says "No se pudo guardar <receta>". A missing or unreadable plan file rejects only the plan changes. A repeated conflict or a Drive outage keeps the change pending. The server remembers for 10 minutes which plan changes it applied, so a retry does not add the recipe twice (best effort, per server instance). The other phone sees the change at its next sync; changes from two phones to the same slot both survive.
- **Source:** `008_meal-plan-calendar_prd.md` (§5, §8, §10), `008_meal-plan-calendar_ux_flow.md`, ADR 003.

#### FLW-remove-plan-recipe Remove a recipe from the plan

- **Goal / trigger:** take a recipe out of a slot.
- **Screens involved (in sequence):** SCR-plan → (X of a recipe) → SCR-plan without it.
- **Business rules governing the flow:** removes one occurrence at once, with no confirmation and no undo, and queues the change. The server removes one dish with that recipe from the slot's meals; a meal left with no dishes, and a day left with no meals, are removed too. The shopping list is not touched.
- **Edge cases & error handling:** removing something that is no longer there changes nothing. Pending, key and rejection behave as in FLW-add-recipe-to-plan.
- **Source:** `008_meal-plan-calendar_prd.md` (§5, §10), `008_meal-plan-calendar_ux_flow.md`.

#### FLW-browse-plan Browse days and weeks

- **Goal / trigger:** see further days of the plan.
- **Screens involved (in sequence):** SCR-plan → (small: reach the end of the list / from 640 px: next or previous week) → SCR-plan showing other days.
- **Business rules governing the flow:** see SCR-plan. The earliest reachable day is today (small windows) or the Monday of the current week; there is no later limit. The week and the loaded days reset when the section is left or the screen is reloaded. If midnight passes while the app is open, the new day is taken at the next focus.
- **Edge cases & error handling:** loading more days offline is never blocked. Resizing the window between the two layouts keeps the plan and any open picker.
- **Source:** `008_meal-plan-calendar_prd.md` (§5, §10), `008_meal-plan-calendar_ux_flow.md`.

---

## Domain: profile

### Overview

Perfil: Al's favorite recipes and the heart that marks them. Favorites are saved to `reviews/al.yaml` in Drive through the same operations, offline queue and write key as the pantry and the plan. Ratings, comments, the "curated" flag and the person picker are not part of this domain yet; the person is always Al.

### Screens / Pages

#### SCR-profile Perfil

- **Platform:** Web, one column in every layout.
- **Purpose:** see and manage Al's favorite recipes. Address `/profile`; the browser tab is titled "Perfil · My Food".
- **Entry points:** Perfil in the main navigation; direct address; "Ver recetas" is the way out, to SCR-library-list.
- **Functional composition:** CMP-app-shell, CMP-recipe-search, CMP-recipe-filters, CMP-favorite-button, CMP-pending-changes, CMP-write-key, SCR-recipe-detail.
- **Data & business rules:**
  - A tab bar with a single tab, "Recetas favoritas", selected. Under it, the search bar and the six filters of Recetas, working only among the favorites (filter options and counts are computed over them).
  - The list shows the favorite recipes in the same row format as SCR-library-list (photo or fallback tile, title, category), alphabetical, each with its heart filled. "N cambios pendientes" shows while changes wait.
  - Tapping a heart unmarks the recipe; its row stays, dimmed with an empty heart, until the search or the filters change or Perfil is left, and can be marked again. Nothing else reorders.
  - Tapping a row opens SCR-recipe-detail over Perfil without changing the address (full screen on small windows, modal on medium and large). Closing returns to Perfil as it was.
  - Search text and filters are emptied when Perfil is left or reloaded.
- **States (business meaning):**
  - Loading: "Cargando tus recetas…".
  - No library and offline, or error: the same messages as the list, with "Reintentar".
  - No favorites: "Aún no tienes favoritas", with the hint "Toca el corazón de una receta para guardarla aquí." and the button "Ver recetas".
  - Favorites: the list described above.
  - No results: "Ninguna receta coincide" with "Borrar búsqueda" and "Quitar filtros" as they apply.
- **Related flows:** FLW-toggle-favorite, FLW-switch-section.
- **Source:** `009_favorites_prd.md` / `_ux_flow.md`; implementation in `src/components/profile/ProfileScreen.tsx`.

### Functionally-Significant Components

#### CMP-favorite-button Favorite button

- **Design system reference:** `FavoriteButton`, `components/recipes/FavoriteButton` (see `context/ui_kit_registry.md`).
- **Functional role:** the heart that marks or unmarks a recipe as a favorite.
- **Behavior rules:** filled when the recipe is a favorite, empty when not, with the state also stated to assistive technology. Icon-only in rows and in the title row of the detail on small windows; with the text "Añadir a favoritos" or "Quitar de favoritos" under the photo on medium and large windows. Its touch area is at least 44 px. It never opens the recipe it belongs to, and all hearts of the same recipe agree at once.
- **Used on:** SCR-library-list, SCR-recipe-detail, SCR-profile.
- **Source:** `009_favorites_prd.md` (US-1, US-2), `009_favorites_ux_flow.md` (§2.4); implementation in `src/components/recipes/FavoriteButton.tsx`.

### Flows

#### FLW-toggle-favorite Mark or unmark a favorite

- **Goal / trigger:** Al taps a heart, or the button under the photo of a recipe.
- **Screens involved (in sequence):** SCR-library-list, SCR-recipe-detail or SCR-profile → the same screen with the new state.
- **Business rules governing the flow:** the new state shows at once and is saved to `favorites` of `reviews/al.yaml`. Offline, or while Drive is unavailable, the change waits on the device and is sent in order when possible. Toggling the same recipe several times while pending ends with the last state, and returning it to the saved state sends nothing. With no key on the device, the change stays pending and the write key dialog (CMP-write-key) opens at the first toggle; "Ahora no" leaves it pending, with "Introducir clave" in the pending indicator. The server writes only `favorites` and `updated` of the file and keeps ratings, comments and the layout.
- **Edge cases & error handling:** if the server rejects a change (for example the recipe no longer exists) the heart returns to the saved state and "No se pudo guardar <receta>" shows for 4 seconds. If `reviews/al.yaml` does not exist, toggling is refused with the same notice and the app never creates the file. A favorite whose recipe no longer exists is not shown and is not removed from the file.
- **Source:** `009_favorites_prd.md` (US-4, US-5, §10).
