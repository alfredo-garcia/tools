# My Food Manager — Master Functional Documentation

> Project: `my-food-manager`

> Entry point. While the product is small, this file contains everything inline, using the
> domain structure repeated under `##` headers. As domains grow, they move to their own
> files under `docs/functional/domains/` and this file becomes a map plus the shared reference.

## 1. Product Overview

My Food Manager (shown to users as "My Food") is a personal, visual, mobile-first web app (installable PWA) that helps Al and his household partner decide what to cook and shop without forgetting anything. It reads the Google Drive folder `food`, which the food-manager skill maintains, and keeps working without a connection. There are no logins. Platform: web only.

Today the app lets you browse the library with filters and a text search and open each recipe's detail, and it has a main navigation with five sections: Recetas, Plan, Compra, Despensa and Perfil. Perfil shows Al's favorite recipes. Recipes can be marked as favorites from the list and from the detail, with a heart, and shared from the detail; favorites are saved to Drive in the same way as the pantry and the plan. Plan is the household's meal calendar: from today on, each day has Desayuno, Almuerzo and Cena, to which recipes are added and removed, and every recipe added is checked against the pantry, offering to put what is missing on the shopping list. A slot can also be marked from the picker as eaten out ("Comer fuera") or ordered in ("Pedir a domicilio"); the mark shows with its own icon so it is clear that meal is not cooked. Despensa holds the pantry and Compra the shopping list, which can be shared as text grouped by family; each ingredient has two switches, "Tengo" and "Comprar", saved to Drive (also from the device without a connection, with a shared write key). Plan changes are saved to Drive in the same way (offline queue and shared write key). Each recipe has a status (Probada, Por probar or Descartada), set outside the app by the food-manager skill; Recetas and the favorites in Perfil start showing only the Probadas and can switch to the others or show all. Al can rate each recipe from 1 to 5 stars from its detail; the rating shows on the rows of Recetas, the favorites of Perfil and the Plan, can be filtered, and sorts Recetas and the favorites from the best rated down; ratings are saved to Drive like favorites. From the recipe detail Al can put what a recipe lacks on the shopping list (a window that sorts its ingredients into Faltan, En mi lista de la compra and Ya tengo) or take the recipe to the Plan, where the picker offers it first the first time it opens. On small windows the recipe detail opens with Info general and Notas collapsed. Comments, the "curated" flag and the person picker of the profile are still pending (see `product/product_vision.md` §7).

## 2. How to Read This Documentation

- **ID scheme:** `SCR-` for screens, `FLW-` for flows, `CMP-` for functionally-significant components.
- **Platform notation:** every screen states its platform. A "Platform divergence" note appears only where behavior differs.
- **Source:** every entry names where it came from (feature PRD, and UX Flow when one exists).
- **Scope:** this document describes what the product does and why. Visual specs live in `context/ui_standards.md` and `context/ui_kit_registry.md` and are only referenced here.

## 3. Domain Map

| Domain | One-line description | File | Status |
|---|---|---|---|
| library | Library sync, offline storage and the recipe list | inline below | Active |
| recipes | Filtering (including by recipe status and rating) and searching the recipe list, reading a recipe, rating it and, from its detail, adding its missing ingredients to the shopping list or taking it to the Plan | inline below | Active |
| navigation | Main navigation between sections and their placeholders | inline below | Active |
| pantry | Pantry (Despensa) and shopping list (Compra, shareable as text), with writes to Drive | inline below | Active |
| plan | Meal-plan calendar with recipe picking (offering first the recipe Al came from), eat-out and delivery marks and a pantry check, with writes to Drive | inline below | Active |
| profile | Perfil: Al's favorite recipes and the heart to mark them, with writes to Drive; Al's ratings are shown and edited from the recipe detail | inline below | Active |

## 4. Navigation Structure

The app has five sections, always reachable from a main navigation: Recetas (`/`, with the recipe detail at `/recipes/<id>`), Plan (`/plan`), Compra (`/shopping-list`), Despensa (`/ingredients`) and Perfil (`/profile`). Perfil shows Al's favorite recipes; Plan shows the meal calendar; Despensa shows the pantry; Compra shows the shopping list. The screen adapts to the window width in three layouts: small (under 640 px), medium (640 to 1279 px) and large (1280 px and above).

- **Small:** a bottom bar with the five sections. It is hidden while a recipe detail is open (the detail is a full screen) and comes back when it closes.
- **Medium and large:** a sidebar on the left with the same five sections, collapsible to icons only or expandable to icons and text. It stays visible when a recipe opens (modal on medium, panel beside the list on large).
- **Recipes:** in small and medium the detail opens over the list; in large the list is a column and the detail opens beside it.
- An address that matches no section shows the standard "page not found" page.

## 5. Screen & Flow Index

**Screens**

| ID | Name | Domain | Platform |
|---|---|---|---|
| SCR-library-list | Recipe list | library | Web |
| SCR-recipe-detail | Recipe detail | recipes | Web |
| SCR-plan | Plan | plan | Web |
| SCR-shopping-list | Compra | pantry | Web |
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
| FLW-share-shopping-list | Share the shopping list | pantry | Web |
| FLW-add-recipe-to-plan | Add a recipe to the plan | plan, recipes | Web |
| FLW-remove-plan-recipe | Remove a recipe from the plan | plan | Web |
| FLW-browse-plan | Browse days and weeks | plan | Web |
| FLW-mark-plan-out | Mark or unmark a slot as eaten out or ordered in | plan | Web |
| FLW-toggle-favorite | Mark or unmark a favorite | profile, library, recipes | Web |
| FLW-rate-recipe | Rate a recipe | recipes, library, profile, plan | Web |
| FLW-share-recipe | Share a recipe | recipes | Web |
| FLW-add-recipe-to-shopping-list | Add a recipe's ingredients to the shopping list | recipes, pantry | Web |

## 6. Cross-Cutting Concepts

- **Writes.** Only the pantry (also from the recipe detail, FLW-add-recipe-to-shopping-list), the plan (recipes and eat-out/delivery marks), Al's favorites and ratings, and the status of a rated recipe are written to Drive, through operations with an offline queue and a shared household write key (see FLW-flip-switch, FLW-add-recipe-to-shopping-list, FLW-add-recipe-to-plan, FLW-mark-plan-out, FLW-toggle-favorite and FLW-rate-recipe). Everything else stays read-only; comments arrive with their own feature. A batch that touches several files is written pantry first, then reviews (favorites and ratings), then the status of the rated recipes, then the plan last, each file on its own.
- **Changes without connection.** A change shows at once, waits on the device and is sent when the connection returns; it is never lost.
- **Offline-first.** After the first sync, the library is always shown from the device, before any network response. Reads are never blocked by a missing connection.
- **Freshness.** A sync runs on app open, every 5 minutes while the app is visible and online, within 5 seconds of regaining a connection, and on a manual request. If Drive has no changes, only the "last synced" time updates. A failed sync leaves the stored data untouched.
- **Invalid data.** A malformed recipe file is skipped and counted as a warning. It never breaks the rest of the library.
- **Access.** No login. Read endpoints are open, which is accepted for low-sensitivity personal data.
- **Navigation everywhere.** The main navigation frames every screen of every section and works offline: switching section needs no data. Library sync keeps running whatever section is open.
- **Browsing works from the device.** Filtering, searching and the recipe detail read only the stored library, so they work offline and never wait for the network. The search text never leaves the device.

## 7. Shared Functional Components

#### CMP-ingredient-groups Ingredient groups

- **Design system reference:** `IngredientGroups`, `components/pantry/IngredientGroups` (see `context/ui_kit_registry.md`).
- **Functional role:** shows the ingredients of a recipe in the groups Faltan, En mi lista de la compra and Ya tengo.
- **Behavior rules:** see "Faltan / En mi lista de la compra / Ya tengo" in the glossary for what each group holds. Each group shows its count in its heading, empty groups are not shown, and "Ya tengo" starts collapsed when it has more than 5 ingredients. With nothing in Faltan it says "No te falta nada: todo está en tu despensa o en tu lista."; a recipe with no catalog ingredients says "Esta receta no tiene ingredientes del catálogo."
- **Used on:** CMP-shopping-list-sheet (recipes) and CMP-missing-ingredients (plan).
- **Source:** `013_recipe-detail-shortcuts_prd.md`, `_ux_flow.md`; implementation in `src/components/pantry/IngredientGroups.tsx` and `src/lib/domain/ingredient-groups.ts`.

## 8. Shared Data Entities

- **Library snapshot.** The complete normalized copy of the `food` folder: recipes (with steps, notes and variations), the ingredient catalog, the pantry, each person's reviews, the vocabularies (categories, tags, units, families) and the list of household people. The people are derived from the review files that exist. The snapshot is replaced as a whole on every sync that finds changes.
- **Recipe status.** `status` of a recipe (recipes schema 4): `to-try` (Por probar), `tried` (Probada) or `discarded` (Descartada), one value for the whole household. A missing, empty or unknown value is Probada. The food-manager skill sets it (new recipes arrive as Por probar; "borrar" makes it Descartada and keeps the file). The app reads it and writes it in one case only: rating a recipe that is Por probar or Descartada makes it Probada, by changing just the `status` and `updated` lines of the recipe's frontmatter (see FLW-rate-recipe). Removing a rating does not undo it.
- **Plan.** `plan/plan.yaml` (plan schema 1, created by the food-manager skill, never by the app): `updated` plus `days`, a map from date (`YYYY-MM-DD`) to a list of meals `{ slot, label, note, dishes }`, where `slot` is `breakfast`, `lunch`, `snack` or `dinner` and a dish is `{ recipe, servings }` (a recipe id), `{ text }` (free description) or `{ out }`, a mark that the meal is not cooked at home: `eat-out` (Comer fuera) or `delivery` (Pedir a domicilio). A meal with `eat-out` has no other dishes; a meal with `delivery` may also hold recipe or text dishes, but only one `delivery`. Several meals may share a slot. The app shows the recipe, text and mark dishes of breakfast, lunch and dinner, and writes only the add or removal of one recipe dish or one mark (and `updated`), applying the mark rules to the whole slot (ADR 005); marks add no ingredients and never touch the pantry. An unknown `out` value is not shown and is kept; labels, notes, servings, text dishes and snack meals stay as they are. Past days are never shown; any writer may remove them.
- **Reviews (Al).** `reviews/al.yaml` (reviews schema 1, created by the food-manager skill, never by the app): `user`, `updated`, `favorites` (recipe ids) and `ratings`. The app writes only `favorites` (a recipe is added at the end or removed), `ratings` (see Rating) and `updated`; comments and unknown fields stay as they are, and a recipe that does not exist is rejected. Until the person picker exists, the person is always Al; the file of the household partner is neither read for favorites nor written.
- **Rating (Al).** `ratings` of `reviews/al.yaml`: a map from recipe id to `{ stars, comment, date }`, where `stars` is an integer from 1 to 5. A missing entry, or a `stars` outside 1 to 5 or not an integer, reads as no rating (the entry stays in the file). The app writes `stars` and `date` (the day of the change, offset -05:00) and keeps the entry's `comment` and unknown fields; removing a rating deletes the whole entry, comment included. The rating is never read from or written to the recipe file.
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
- **Section / destination:** one of the five options of the main navigation: Recetas, Plan, Compra, Despensa or Perfil.
- **Compra / Lista de compra / Lista de la compra:** Compra is the navigation section of the shopping list; "Lista de compra" is its screen title; "Lista de la compra" is the first line of the shared text.
- **Bottom bar:** the navigation on small windows.
- **Sidebar:** the navigation on medium and large windows; collapsed shows only icons, expanded shows icons and text.
- **Placeholder section:** a section with no content yet, which shows its title and "Próximamente" (today none).
- **Favorite (favorita):** a recipe whose id is in `favorites` of Al's reviews file, counting the changes still pending on the device.
- **Share menu (menú de compartir):** the device's own sheet of apps to send content to, opened by the Compartir button of a recipe or of Compra.
- **Heart (corazón):** the control that marks or unmarks a favorite; filled when the recipe is a favorite.
- **Status (estado):** whether the household has cooked a recipe and kept it: Por probar (a new idea), Probada (cooked and kept; also any recipe without a status) or Descartada (not wanted, hidden by default but never deleted).
- **Rating:** Al's 1 to 5 stars for a recipe.
- **Sin rating:** a recipe with no rating; also the Rating filter option that shows only those.
- **Rating mark (marca de rating):** the filled star and number ("★ 4") that a list row shows for a rated recipe, on the category's line and centered with it; display only.
- **Plan:** the household's agenda of recipes per day and meal.
- **Slot (franja):** one meal time of one day: Desayuno, Almuerzo or Cena (the file also knows `snack`, not shown).
- **Mark (marca) / Comer fuera / Pedir a domicilio:** a slot's `out` dish, meaning that meal is not cooked at home. Comer fuera (`eat-out`) takes the whole slot; Pedir a domicilio (`delivery`) may share the slot with recipes, at most once. The picker offers them as "Salir fuera" and "Pedir".
- **Faltan / En mi lista de la compra / Ya tengo:** the three groups of a recipe's ingredients (catalog ingredients only, each once, in recipe order, optional ones included). Ya tengo: a staple, or "Tengo" on even if "Comprar" is also on. En mi lista de la compra: not Ya tengo and "Comprar" on. Faltan: the rest. Ingredients outside the catalog are not listed.
- **Receta de origen / "Tu receta":** the recipe whose detail Al left with "Añadir al plan"; the Plan's picker lists it first, chosen, with the tag "Tu receta".
- **Filter:** one of Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína, Estado or Rating; each holds one chosen value at a time.
- **Search / applied text:** the text typed in the search bar is the typed text; the applied text is the trimmed typed text once it has 3 or more characters and 1 second has passed without typing (or Enter was pressed). Only the applied text filters the list.
- **Tengo / Comprar:** the two independent switches of an ingredient: "Tengo" (it is at home, `have`) and "Comprar" (it must be bought, `to_buy`). Any combination is valid.
- **Staple (básico):** an ingredient that is always available (water, salt…); it shows "Tengo" on and locked, "Comprar" off and locked.
- **Outbox (cola de cambios):** the ordered list of changes made on the device that Drive has not confirmed yet.
- **Write key (clave de escritura):** the household's shared key that authorizes writes; asked once per device.
- **Family (familia):** the classification of an ingredient (verdura, lácteo…), used by the family filter of Despensa and Compra and to group the shared list.
- **Result group:** one of Recetas (the name matched), Proteína (a protein label matched) or Ingredientes (an ingredient name matched). A recipe appears in every group where it matches.

## 11. Recent Changes

- 2026-11-03 — navigation, pantry, recipes: the shopping list becomes the Compra section, with a badge and sharing as text grouped by family; Despensa without tabs, its filter opening on Todos; Info general and Notas collapsed on small windows; rating mark centered on the category line (see `changelog/015_shopping-list-section_changelog.md`).
- 2026-11-03 — plan: slots can be marked as Comer fuera or Pedir a domicilio from the picker, shown first in the slot with their own icon and saved to Drive (see `changelog/014_plan-eat-out-delivery_changelog.md`).
- 2026-11-03 — recipes, plan: shortcuts in the recipe detail to add a recipe's missing ingredients to the shopping list and to take it to the Plan, where the picker offers it first; the Plan's missing-ingredients sheet uses the same three groups (see `changelog/013_recipe-detail-shortcuts_changelog.md`).
- 2026-11-02 — recipes, library, profile, plan: recipe ratings (1 to 5 stars) set from the recipe detail, shown on the lists, filterable and used as the default order, saved to Drive; a rated recipe becomes Probada (see `changelog/012_recipe-ratings_changelog.md`).
- 2026-11-02 — recipes, profile, plan: recipe status filter (Estado) in Recetas and in the favorites of Perfil, starting on Probadas, and discarded recipes left out of the Plan's picker (see `changelog/011_recipe-status-filter_changelog.md`).
- 2026-10-30 — recipes: Compartir button in the recipe detail, opening the device share menu with the photo, title and link (see `changelog/010_share-recipe_changelog.md`).
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
- **Data & business rules:** lists recipes from the best rated down: by stars from 5 to 1, then the unrated ones, and recipes with the same rating alphabetically by title (Spanish collation). Each row shows the photo or fallback tile, the title and the category name followed, on the same line and centered with it, by Al's rating mark when the recipe has one (display only; the stars to rate are in the detail, CMP-rating-stars), and opens the recipe's detail (rows are at least 56 px high). At the right of every row is a heart (CMP-favorite-button) that marks or unmarks the recipe as a favorite without opening it; the row stays where it is and the list does not reorder for it. A change of rating, in contrast, reorders the list at once with animation. "N cambios pendientes" (CMP-pending-changes) shows above the list while changes wait. Under the title is the search bar (see CMP-recipe-search) and below it the eight filters (see CMP-recipe-filters). The list opens with Estado on Probadas, so only the Probadas show and the count reads "N de M recetas" from the start, with M counting every recipe of every status; leaving Recetas and coming back restores that initial state. The count line "N de M recetas" and "Limpiar" show when a filter is active, and the count also shows while a search is applied. With an applied search, the list becomes up to three groups of rows (Recetas, Proteína, Ingredientes), each headed by its name and its number of recipes, e.g. "Proteína · 3"; empty groups are not shown, and N counts the different recipes shown. "N con avisos" shows when there are warnings. With an applied search the groups keep their own order and the rating order does not apply. If the browser cannot store data, a notice says that offline only shows what is already loaded.
- **States (business meaning):**
  - Loading: no stored library and the first sync is running; "Cargando tus recetas…".
  - Offline with no data: "Necesitas conexión la primera vez", with a "Reintentar" button.
  - Error with no data: "No se pudo cargar tu biblioteca", with a "Reintentar" button.
  - Empty: a stored library with no recipes; "No hay recetas todavía".
  - List: the stored library is shown immediately, online or offline.
  - Grouped results: a search is applied and at least one recipe matches; the groups described above.
  - No results: the active filters, or the applied search with the filters, match nothing; "Ninguna receta coincide" with a hint and the buttons that apply: "Borrar búsqueda" when a search is applied and "Quitar filtros" when a filter is active.
- **Related flows:** FLW-first-sync, FLW-library-refresh, FLW-filter-recipes, FLW-search-recipes, FLW-open-recipe, FLW-toggle-favorite.
- **Source:** `001_drive-sync-offline-library_prd.md` (no UX Flow exists for that feature), `003_recipe-filters_prd.md` / `_ux_flow.md`, `002_recipe-detail_prd.md` / `_ux_flow.md`, `004_responsive-recipe-layout_prd.md` / `_ux_flow.md`, `005_recipe-search_prd.md` / `_ux_flow.md`, `009_favorites_prd.md` / `_ux_flow.md`, `011_recipe-status-filter_prd.md` / `_ux_flow.md`, `012_recipe-ratings_prd.md` / `_ux_flow.md`; implementation in `src/components/recipes/RecipeLibrary.tsx` and `src/components/recipes/RecipeRow.tsx`.

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
- **Business rules governing the flow:** the library is stored on the device when the sync completes. A stored library with a different format version than the app expects is discarded and fetched again; while offline, the old copy is kept and used. The library stored before recipe status existed is fetched again this way, so recipes show their status.
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

Filtering and searching the recipe list and reading a recipe. Everything works from the stored library, online or offline. The only writes are Al's ratings (FLW-rate-recipe) and the "Comprar" marks put on the shopping list from the detail (FLW-add-recipe-to-shopping-list).

### Screens / Pages

#### SCR-recipe-detail Recipe detail

- **Platform:** Web.
- **Platform divergence:** by window width. Small (under 640 px): a full screen with an "Atrás" button. Medium (640 to 1279 px): a modal (max width 720 px) over the list, with a "Cerrar" button, Esc and a click on the backdrop to close. Large (1280 px and above): a panel on the right of the list column that uses all the width left, with a "Cerrar" button; it is not a modal, so the list stays usable and Esc does nothing. On small windows the bottom bar is hidden while it is open; on medium and large the sidebar stays visible. Resizing across a breakpoint keeps the open recipe, its scroll position, its open sections and the open time breakdown.
- **Purpose:** read everything needed to decide on and cook a recipe.
- **Entry points:** a row of SCR-library-list; an ingredient that links to another recipe; opening `/recipes/<id>` directly.
- **Functional composition:** CMP-detail-layer, CMP-recipe-photo, CMP-collapsible-section, CMP-recipe-link, CMP-favorite-button, CMP-share-button, CMP-shopping-list-sheet.
- **Data & business rules:**
  - The top has the photo (16:9; the category tile when there is none) and the title. On medium and large windows the title is always in the bar at the top of the modal or panel; on small windows it is under the photo. On large windows the photo takes two fifths of the width and Info general sits beside it, in the other three fifths.
  - Favorite: on small windows a button with the heart and the text "Añadir a favoritos" or "Quitar de favoritos" (CMP-favorite-button) sits under the rating, above the two shortcuts, with the full width of the content; the title row keeps only the share icon. On medium and large windows a button with the heart and the text "Añadir a favoritos" or "Quitar de favoritos" sits under the photo, with the width of its content; on large windows it is in the photo's column, beside Info general. Tapping it changes the recipe's state at once, also in the list row behind.
  - Rating (CMP-rating-stars): five stars, grey when the recipe has no rating and filled up to the rating when it has one, with the text "Sin rating" or "N de 5" beside them. On small windows they sit in their own row under the title row. On medium and large windows they sit under the photo in one row with the favorite and share buttons when the three fit; when they do not, the stars keep their own row and the two buttons take the next one. See FLW-rate-recipe. The detail still has no comment or "curated" control.
  - Shortcuts: two buttons, "Añadir a lista de compra" and "Añadir al plan", shown for every recipe in every status. On small windows they are stacked under the favorite button, all three with the same width; on medium and large windows they take one wrapping row under the rating, favorite and share row. "Añadir a lista de compra" opens CMP-shopping-list-sheet. "Añadir al plan" shows the Plan at `/plan?add=<recipe id>` and closes the detail; with the detail open over the Plan it closes the detail and offers the recipe there with no navigation (see FLW-add-recipe-to-plan).
  - Share (CMP-share-button): beside the favorite control, an icon on the title row on small windows and a button "Compartir" next to "Añadir a favoritos" under the photo on medium and large windows (on a second line when the photo column is narrow). It is present wherever the detail opens (from Recetas, from the favorites in Perfil and over the Plan) and never in the lists. See FLW-share-recipe.
  - Four sections, in this order, each collapsible on its own (the state is not remembered): Info general, Ingredientes, Pasos, Notas. Ingredientes and Pasos open on entry on every window. Info general and Notas open on entry on medium and large windows and start collapsed on small ones; the window size when the recipe opens decides, and each recipe opened starts again from that rule.
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
- **Related flows:** FLW-open-recipe, FLW-toggle-favorite, FLW-share-recipe, FLW-rate-recipe, FLW-add-recipe-to-shopping-list, FLW-add-recipe-to-plan.
- **Source:** `002_recipe-detail_prd.md`, `002_recipe-detail_ux_flow.md`, `004_responsive-recipe-layout_prd.md`, `004_responsive-recipe-layout_ux_flow.md`, `009_favorites_prd.md` / `_ux_flow.md`, `010_share-recipe_prd.md` / `_ux_flow.md`, `012_recipe-ratings_prd.md` / `_ux_flow.md`, `013_recipe-detail-shortcuts_prd.md` / `_ux_flow.md`; implementation in `src/components/recipes/detail/`.

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
  - Active filters, Estado included, are applied first and the three groups are computed on what remains, so with Estado on Probadas a Descartada recipe is in no group. A recipe is listed in every group where it matches. Rows keep the alphabetical order and the same look as the plain list; on large windows the open recipe's row is highlighted in every group.
  - The filters' option counts ignore the search.
  - A sync that updates the library re-applies the search and the filters in place. The text is not saved: reloading, or leaving Recetas and coming back, empties it.
  - Category, cuisine, diet, difficulty, time, steps, notes, comments and sources are not searched; there is no relevance order, highlighting or typo tolerance.
- **Used on:** SCR-library-list.
- **Source:** `005_recipe-search_prd.md`, `005_recipe-search_ux_flow.md`; implementation in `src/components/inputs/SearchInput.tsx`, `src/components/recipes/use-search-query.ts`, `src/components/recipes/RecipeLibrary.tsx` and `src/lib/domain/search.ts`.

#### CMP-recipe-filters Recipe filters

- **Design system reference:** `RecipeFilters`, `components/recipes/RecipeFilters` (see `context/ui_kit_registry.md`).
- **Functional role:** the filter row above the list, its option panel, the count and "Limpiar".
- **Behavior rules:**
  - Eight filters, in this order: Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína, Estado, Rating. A filter shows only its name until a value is chosen; then it shows the value with an "x" that removes it and brings the name back. Opening one filter closes any other; Esc or a tap outside closes the options.
  - One value per filter. Filters combine, so a recipe must match all active ones. With several tags in a family (cuisine, diet, protein), a recipe matches if any of them equals the chosen value.
  - Options are the values present in the library, in vocabulary order (values missing from the vocabulary come last, alphabetically), each with the number of recipes it would give with the other active filters. An option with 0 is disabled; the chosen one never is. A filter with no values in the library is disabled.
  - Estado starts on "Probadas" each time the list or the favorites tab opens. Its options are always "Probadas", "Por probar" and "Descartadas", in that order, even when the library has none of one of them (it is then disabled with 0). Its "x" removes the filter, which applies no status condition and shows every status. A recipe without a valid status counts as Probada. The counts of the other filters take Estado into account.
  - Rating has six fixed options, in this order: "1+ ★", "2+ ★", "3+ ★", "4+ ★", "5 ★" and "Sin rating", each with its count. "N+" matches Al's rating of N stars or more, "5 ★" exactly five, and "Sin rating" the unrated recipes. It has no initial value, so with it off rated and unrated recipes show. It counts for "Limpiar".
  - Tiempo uses total time with four options: "Hasta 15 min", "Hasta 30 min", "Hasta 1 h", "Más de 1 h". Dificultad shows "Fácil", "Media", "Difícil". A recipe with no time or no difficulty never matches those filters when active.
  - Option and chip labels come from the vocabularies with the first letter capitalized; a value missing from the vocabulary shows its id, also capitalized.
  - The count reads "N recetas" with no filter and "N de M recetas" with filters. "Limpiar" clears all filters, Estado included, and appears when two or more are active (Estado counts).
  - The list reorders with animation, which is off when the device asks for reduced motion.
- **Used on:** SCR-library-list.
- **Source:** `003_recipe-filters_prd.md`, `003_recipe-filters_ux_flow.md`, `011_recipe-status-filter_prd.md` / `_ux_flow.md`, `012_recipe-ratings_prd.md` / `_ux_flow.md`; implementation in `src/components/recipes/RecipeFilters.tsx`.

#### CMP-rating-stars Rating stars

- **Design system reference:** `RatingStars`, `components/recipes/RatingStars` (see `context/ui_kit_registry.md`); the read-only mark on rows is `RatingMark`.
- **Functional role:** sets, changes or removes Al's rating of a recipe in the detail.
- **Behavior rules:** five stars, each a button of at least 44 px named "N estrella(s)" and pressed when it is at or below the rating; grey with no rating. Tapping star N sets the rating to N; tapping the star that equals the current rating removes it. The current value is also stated as text ("Sin rating" or "N de 5") and to assistive technology.
- **Used on:** SCR-recipe-detail.
- **Source:** `012_recipe-ratings_prd.md` (US-1), `012_recipe-ratings_ux_flow.md` (§2.1); implementation in `src/components/recipes/RatingStars.tsx` and `src/components/recipes/RatingMark.tsx`.

#### CMP-detail-layer Detail layer

- **Design system reference:** `DetailLayer`, `components/overlays/DetailLayer`.
- **Functional role:** shows the recipe detail as a full screen, a modal or a side panel, depending on the window width.
- **Behavior rules:** as a full screen or a modal it closes with the back or close button (the modal also with Esc or the backdrop), locks the page behind it, keeps focus inside and returns focus to the row that opened it on close. As a panel it does none of that: the page is not locked, focus is not trapped and Esc does nothing; closing it empties the panel and returns focus to the row that was selected. Switching between the three never closes the recipe or rebuilds its content.
- **Used on:** SCR-recipe-detail.
- **Source:** `002_recipe-detail_prd.md`, `004_responsive-recipe-layout_prd.md`; implementation in `src/components/overlays/DetailLayer.tsx`.

#### CMP-collapsible-section Collapsible section

- **Design system reference:** `CollapsibleSection`, `components/recipes/detail/CollapsibleSection`.
- **Functional role:** a titled section of the detail that folds and unfolds.
- **Behavior rules:** starts open, or collapsed where its screen says so (Info general and Notas on small windows); folds independently of the others; announced to screen readers as expanded or collapsed.
- **Used on:** SCR-recipe-detail.
- **Source:** `002_recipe-detail_prd.md`, `015_shopping-list-section_prd.md` (US-4); implementation in `src/components/recipes/detail/CollapsibleSection.tsx`.

#### CMP-recipe-link Recipe link

- **Design system reference:** `RecipeLink`, `components/recipes/RecipeLink`.
- **Functional role:** a link to a recipe's detail.
- **Behavior rules:** a normal click opens the detail in place, with no network request; opening it in a new tab or copying the link works as for any link. In the side panel the link of the open recipe is marked as the current one, and choosing another recipe replaces the history entry instead of adding one.
- **Used on:** SCR-library-list, SCR-recipe-detail.
- **Source:** `002_recipe-detail_prd.md`; implementation in `src/components/recipes/RecipeLink.tsx`.

#### CMP-share-button Share button

- **Design system reference:** `ShareButton`, `components/recipes/ShareButton` (see `context/ui_kit_registry.md`).
- **Functional role:** the control that shares the open recipe or the shopping list.
- **Behavior rules:** icon-only on the title row of small windows; with the text "Compartir" under the photo on medium and large windows, with the width of its content. Disabled (busy) while the photo is awaited. A tap opens the device's share menu (see FLW-share-recipe); where the browser has none it copies the link. In Compra: with the text "Compartir" next to the search, hidden when the list is empty (FLW-share-shopping-list).
- **Used on:** SCR-recipe-detail and SCR-shopping-list (never in recipe lists).
- **Source:** `010_share-recipe_prd.md` (US-1), `010_share-recipe_ux_flow.md` (§2.2), `015_shopping-list-section_prd.md` (US-3); implementation in `src/components/recipes/ShareButton.tsx`.

### Flows

#### CMP-shopping-list-sheet Shopping-list window

- **Design system reference:** `Sheet` (with the "Atrás" back control), `Button`, CMP-ingredient-groups; `ShoppingListSheet` in `context/ui_kit_registry.md`.
- **Functional role:** shows where each ingredient of a recipe stands and puts the Faltan ones on the shopping list.
- **Behavior rules:** titled with the recipe, subtitle "Lista de compra". It shows CMP-ingredient-groups and the buttons "Cancelar" and "Añadir a la lista". With nothing in Faltan, or with no catalog ingredients, "Añadir a la lista" is disabled. The groups follow the pending changes while it is open. "Añadir a la lista" turns "Comprar" on for the Faltan ingredients only and closes it; "Cancelar", "Atrás", Esc or the backdrop close it with no change. Closing it always returns to the detail.
- **Used on:** SCR-recipe-detail (wherever it opens: Recetas, Perfil or the Plan).
- **Source:** `013_recipe-detail-shortcuts_prd.md`, `_ux_flow.md` (§2.2); implementation in `src/components/recipes/detail/ShoppingListSheet.tsx`.

#### FLW-open-recipe Open and close a recipe

- **Goal / trigger:** read a recipe and return to where you were.
- **Screens involved (in sequence):** SCR-library-list → SCR-recipe-detail → (back, close, Esc, backdrop or device back gesture) → SCR-library-list.
- **Business rules governing the flow:** each recipe has its own address, `/recipes/<id>`. Opening from the list or from an ingredient link needs no network. Closing goes back one step; a detail opened directly closes to the list, never out of the app. On small and medium windows the list keeps its scroll position and cannot be used while the detail is open. On large windows the list stays usable beside the panel: choosing the first recipe adds a history entry, choosing another one replaces it, an ingredient link adds one, and closing or going back leaves `/` with an empty panel (no recipe is selected on its own). Opening `/recipes/<id>` directly on a large window shows the list with that recipe in the panel.
- **Edge cases & error handling:** an unknown address shows the not-found state. If a sync removes the open recipe, the detail switches to not found. Opening a recipe address directly with no connection works.
- **Source:** `002_recipe-detail_prd.md` (US-1, US-2, §10), `004_responsive-recipe-layout_prd.md` (US-1 to US-7).

#### FLW-share-recipe Share a recipe

- **Goal / trigger:** Al taps "Compartir" in a recipe's detail to send it.
- **Screens involved (in sequence):** SCR-recipe-detail → the device's share menu → SCR-recipe-detail.
- **Business rules governing the flow:** the menu receives the recipe's title, its photo and the link to its detail, `<app address>/recipes/<id>`, which opens that recipe in the app. The photo is loaded when the detail opens, so the menu opens at once; a tap waits at most 1.5 seconds for a photo still loading. With a photo the link travels in the text next to the title; without it, as the link of the share. The photo is shared as `<id>.jpg` only if the recipe has one and the device can share images. Nothing is written to Drive.
- **Edge cases & error handling:** no photo, a photo that cannot be loaded (offline and not cached) or a device that cannot share images: it shares the title and the link, with no notice. Cancelling the menu does nothing; any other failure says "No se pudo compartir". A browser with no share menu copies the link and says "Enlace copiado", or "No se pudo copiar el enlace" if the clipboard is refused. While the photo is awaited the button is disabled.
- **Source:** `010_share-recipe_prd.md` (US-2 to US-5, §10).

#### FLW-filter-recipes Filter the list

- **Goal / trigger:** narrow the list in two taps.
- **Screens involved (in sequence):** SCR-library-list.
- **Business rules governing the flow:** tapping a filter opens its options; choosing one applies it and the filter shows the chosen value with an "x" to remove it. "Limpiar" removes all filters, Estado included, when two or more are active. Estado starts on Probadas and has two more options, Por probar and Descartadas; its "x" shows every status. Rating starts empty and narrows by Al's stars (1+ to 4+, 5, or Sin rating). Time options: hasta 15 min, hasta 30 min, hasta 1 h, más de 1 h, measured on total time. Recipes with no time or difficulty never match those options. Filters are not kept across reloads.
- **Edge cases & error handling:** filters that match nothing show "Ninguna receta coincide" with "Quitar filtros". A sync re-applies the active filters in place.
- **Source:** `003_recipe-filters_prd.md` (US-1 to US-6).

#### FLW-search-recipes Search the list

- **Goal / trigger:** find a known recipe by a few letters of its name, its protein or an ingredient.
- **Screens involved (in sequence):** SCR-library-list (plain list) → (type 3 or more characters and pause 1 second, or press Enter) → SCR-library-list (grouped results) → (tap "x", press Esc, or delete letters until fewer than 3 remain) → SCR-library-list (plain list).
- **Business rules governing the flow:** see CMP-recipe-search. Search and filters combine and are independent of each other. Opening a recipe from any group keeps the text and the scroll position while the detail is open; on large windows the list stays usable beside the panel.
- **Edge cases & error handling:** text of only spaces counts as fewer than 3 characters. Pasted text applies after the same 1-second wait. Very long text simply matches nothing. Special characters are plain text. If nothing matches, "Ninguna receta coincide" offers "Borrar búsqueda" (and "Quitar filtros" when filters are active). Offline behaves exactly as online, with no request.
- **Source:** `005_recipe-search_prd.md` (US-1 to US-5, §10).


#### FLW-rate-recipe Rate a recipe

- **Goal / trigger:** Al taps a star in the recipe detail.
- **Screens involved (in sequence):** SCR-recipe-detail → the same screen with the new rating; the rows of SCR-library-list, SCR-profile and SCR-plan update behind it, and SCR-library-list and the favorites reorder.
- **Business rules governing the flow:** the new rating shows at once and is saved to `ratings` of `reviews/al.yaml`. Offline, or while Drive is unavailable, the change waits on the device and is sent in order with the other pending changes ("N cambios pendientes"). Several taps on one recipe while pending end with the last value, and returning to the saved value sends nothing. With no key on the device, the change stays pending and the write key dialog (CMP-write-key) opens at the first change; "Ahora no" leaves it pending. Rating a recipe that is Por probar or Descartada also makes it Probada: it reads as Probada at once on the device and the server then edits only `status` and `updated` of the recipe file; a recipe that is already Probada, or has no status, is not touched, and removing a rating never changes the status. The server writes only `ratings[recipe]` and `updated` of the reviews file, keeps the entry's comment when setting and deletes the whole entry when removing.
- **Edge cases & error handling:** if the server rejects a change, the rating returns to the saved value and "No se pudo guardar <receta>" shows for 4 seconds. If `reviews/al.yaml` does not exist, rating is refused with the same notice and the app never creates the file. If the rating is saved but the recipe's status cannot be written, the rating stays and rating that recipe again retries the status. A rating of a recipe that no longer exists is not shown and is not removed from the file. A rated recipe that leaves Estado's current value (for example a Por probar recipe seen in Estado "Por probar") leaves that list when it becomes Probada.
- **Source:** `012_recipe-ratings_prd.md` (US-1, US-2, US-6, §10), `012_recipe-ratings_ux_flow.md`; ADR 004.

#### FLW-add-recipe-to-shopping-list Add a recipe's ingredients to the shopping list

- **Goal / trigger:** buy what a recipe lacks without leaving its detail.
- **Screens involved (in sequence):** SCR-recipe-detail → ("Añadir a lista de compra") → CMP-shopping-list-sheet → ("Añadir a la lista") → SCR-recipe-detail → (if the device has no key) CMP-write-key.
- **Business rules governing the flow:** the Faltan ingredients read as "En mi lista de la compra" at once and are saved to `to_buy` of the pantry with the same outbox, write key and retry rules as FLW-flip-switch. The key is asked after the window closes; "Ahora no" leaves the changes pending.
- **Edge cases & error handling:** a rejected change returns the ingredient to its saved state and shows "No se pudo guardar <ingrediente>" for 4 seconds, also when the detail is open over Recetas or Perfil. With Faltan empty nothing is written; an ingredient already on the list is not touched.
- **Source:** `013_recipe-detail-shortcuts_prd.md` (§5 US-1, §10), `_ux_flow.md` (§2.2).

---

## Domain: navigation

### Overview

How the user moves between the sections of the app, and (when there are any) the sections that have no content yet. It writes nothing to Drive and needs no data, so it works offline.

### Screens / Pages

No section is a placeholder today: every section has its own screen.

### Functionally-Significant Components

#### CMP-main-navigation Main navigation

- **Design system reference:** `AppFrame`, `components/layout/AppFrame`; `BottomNav` and `SideNav`, `components/navigation/Nav` (see `context/ui_kit_registry.md`).
- **Functional role:** lets the user go to Recetas, Plan, Compra, Despensa or Perfil from any screen, and shows which section is current.
- **Behavior rules:**
  - The five sections are always in this order. The current section is the one whose address matches, including addresses below it; Recetas is current for `/` and for any recipe detail. For an unknown address no section is marked.
  - Below 640 px it is a bottom bar with icon and text; from 640 px it is a sidebar. Crossing 640 px switches between them at once without changing the section or the open recipe.
  - The bottom bar is not shown while a recipe detail is open on a small window.
  - The sidebar can be collapsed (icons only; the names stay available to assistive technology) or expanded. With no saved choice it starts expanded on large windows and collapsed on medium ones. The choice is saved on the device and applies to both sizes; if the browser cannot save it, the default applies and the app works as usual.
  - The sidebar shows the app icon (a pot with steam) and the name "My Food" beside it when expanded.
  - Switching sections does not reload the page and needs no connection.
  - Compra shows over its icon the number of ingredients with "Comprar" on (pending changes included), "99+" above 99, in the bottom bar and the sidebar (collapsed too); with none, no badge. The number is part of the item's name for assistive technology ("Compra, N por comprar").
- **Used on:** every screen.
- **Source:** `006_main-navigation_prd.md` / `_ux_flow.md`, `015_shopping-list-section_prd.md` / `_ux_flow.md`; implementation in `src/components/layout/AppFrame.tsx`, `src/components/navigation/Nav.tsx` and `src/lib/domain/navigation.ts`.

### Flows

#### FLW-switch-section Switch section

- **Goal / trigger:** go to another part of the app.
- **Screens involved (in sequence):** any screen → (tap a section in the bottom bar or sidebar) → SCR-library-list, SCR-plan, SCR-shopping-list, SCR-ingredients or SCR-profile.
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

The pantry (Despensa) and the shopping list (Compra) over the ingredient catalog, with writes to Drive: only `have` and `to_buy` of `pantry/pantry.yaml`. Compra can also share the list as text. Reading works from the stored library, online or offline.

### Screens / Pages

#### SCR-ingredients Despensa

- **Platform:** Web.
- **Purpose:** record in one tap whether an ingredient is at home and whether it must be bought, and see what is to buy. Address `/ingredients`; the browser tab is titled "Despensa · My Food".
- **Entry points:** Despensa in the main navigation; direct address; "Ir a Despensa" from an empty Compra.
- **Functional composition:** CMP-main-navigation, CMP-app-shell, CMP-pantry-list, CMP-pending-changes, CMP-write-key.
- **Data & business rules:**
  - No tabs: the shopping list is its own section, Compra (SCR-shopping-list). Leaving the section or reloading resets the search and the filters.
  - A Todos / Tengo / No tengo filter ("Todos" by default). Every ingredient row has two independent switches, "Tengo" and "Comprar"; neither changes the other. An active search ignores the Todos / Tengo / No tengo filter. A row whose "Tengo" changes stays in place until the filter or the search changes.
  - Staples are shown with "Tengo" on and locked and "Comprar" off and locked, labelled "Básico, siempre disponible"; the pantry file never lists them.
  - Data: ingredient catalog, family vocabulary and the pantry.
- **States (business meaning):**
  - Loading, no library while offline, and error: as the recipe list, with "Reintentar".
  - No match: "Ningún ingrediente coincide", with "Borrar búsqueda" and/or "Quitar filtros".
- **Related flows:** FLW-flip-switch, FLW-enter-write-key.
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `007_pantry-shopping-list-switches_ux_flow.md`, `015_shopping-list-section_prd.md` (US-2); implementation in `src/components/pantry/` and `src/app/ingredients/page.tsx`.

#### SCR-shopping-list Compra

- **Platform:** Web.
- **Purpose:** see and tick off what is to buy, and send the list. Address `/shopping-list`, title "Lista de compra"; the browser tab is titled "Lista de compra · My Food".
- **Entry points:** Compra in the main navigation; direct address.
- **Functional composition:** CMP-main-navigation, CMP-app-shell, CMP-pantry-list, CMP-share-button, CMP-pending-changes, CMP-write-key.
- **Data & business rules:**
  - The ingredients with "Comprar" on, with search and the family filter only; each row has only "Comprar". Turning "Comprar" off leaves the row struck through until leaving Compra, so a slip is undone with one tap.
  - "Compartir" next to the search while the list has at least one ingredient (see FLW-share-shopping-list).
  - Leaving the section or reloading resets the search, the filter and the struck rows.
  - Data: ingredient catalog, family vocabulary and the pantry.
- **States (business meaning):**
  - Loading, no library while offline, and error: as Despensa, with "Reintentar".
  - No match: "Ningún ingrediente coincide", with "Borrar búsqueda" and/or "Quitar filtros".
  - Empty list: "Tu lista está vacía", with "Ir a Despensa".
- **Related flows:** FLW-flip-switch, FLW-enter-write-key, FLW-share-shopping-list.
- **Source:** `007_pantry-shopping-list-switches_prd.md` / `_ux_flow.md`, `015_shopping-list-section_prd.md` (US-1, US-3) / `_ux_flow.md` (§2.2); implementation in `src/components/pantry/IngredientsScreen.tsx` and `src/app/shopping-list/page.tsx`.

### Functionally-Significant Components

#### CMP-pantry-list Ingredient search and filters

- **Design system reference:** `SearchInput`, `FilterChip`, `FilterOptions` (see `context/ui_kit_registry.md`); temporary `TmpSwitch` and `TmpSegmentedControl`.
- **Functional role:** the search bar, the family filter and the switch rows of Despensa and Compra.
- **Behavior rules:**
  - Search: 3 characters minimum; applies 1 second after the last keystroke or on Enter; "x" and Esc clear it. Case and accents are ignored ("ñ" is a different letter); it searches the name and the synonyms, and with several words all must be in the same name or synonym. The text never leaves the device.
  - Family filter: one family at a time, with the count per option. The options are the families present in the screen's list, in vocabulary order; an ingredient with no family counts under "Otros".
  - Sorted alphabetically (Spanish).
- **Used on:** SCR-ingredients, SCR-shopping-list.
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
- **Screens involved (in sequence):** SCR-ingredients or SCR-shopping-list → (flip "Tengo" or "Comprar") → the same screen with the new value and, until confirmed, CMP-pending-changes.
- **Business rules governing the flow:** the change shows at once and goes to the device's outbox; it is sent as soon as there is a connection and a key. Several changes to the same switch collapse into the last one. Without connection or after a failure it retries after 2, 5, 15 and 60 seconds, then every 60 seconds while the app is visible. The server applies the changes to the latest `pantry.yaml`, retrying once on a conflict, edits only the touched lines and sets `updated` with offset `-05:00`.
- **Edge cases & error handling:** an unknown ingredient, a staple, or a file that is not schema 2 is rejected with a notice, never merged into another format. A Drive outage or a repeated conflict keeps the change pending. The other phone sees the change at its next sync; the last change to an ingredient wins.
- **Source:** `007_pantry-shopping-list-switches_prd.md` (§5, §10).

#### FLW-enter-write-key Enter the write key

- **Goal / trigger:** authorize this device to write (first change, a rejected key, or "Introducir clave").
- **Screens involved (in sequence):** SCR-ingredients → CMP-write-key → SCR-ingredients with the pending changes sent.
- **Business rules governing the flow:** the key is stored on the device; once accepted, pending changes are sent in order.
- **Edge cases & error handling:** a wrong key keeps the dialog open with "La clave no es correcta"; "Ahora no" leaves the changes pending.
- **Source:** `007_pantry-shopping-list-switches_prd.md`, `_ux_flow.md`.

#### FLW-share-shopping-list Share the shopping list

- **Goal / trigger:** Al taps "Compartir" in Compra to send the list.
- **Screens involved (in sequence):** SCR-shopping-list → the device's share menu → SCR-shopping-list.
- **Business rules governing the flow:** the menu receives text only, with no title, link or image: the line "Lista de la compra", then one block per family, separated by a blank line, with the family label and one "☐ Name" line per ingredient in alphabetical order. Families follow the vocabulary order, then unknown families alphabetically, and "Otros" last. It always shares the whole list, ignoring the search and the family filter, and leaves out the rows struck through; pending changes count. Nothing is written to Drive, and it works offline.
- **Edge cases & error handling:** cancelling the menu does nothing; any other failure says "No se pudo compartir". A browser with no share menu copies the text and says "Lista copiada", or "No se pudo copiar la lista" if the clipboard is refused. The button is disabled while the menu opens.
- **Source:** `015_shopping-list-section_prd.md` (US-3, §7, §10).

---

## Domain: plan

### Overview

The household's meal calendar. Every day from today has three slots, Desayuno, Almuerzo and Cena, that hold any number of recipes, or a mark that the meal is eaten out or ordered in. It writes only the add and removal of recipe dishes and marks in `plan/plan.yaml`; reading works from the stored library, online or offline. Adding a recipe also sorts its ingredients into Faltan, En mi lista de la compra and Ya tengo and can mark Faltan as "Comprar".

### Screens / Pages

#### SCR-plan Plan

- **Platform:** Web. **Platform divergence:** below 640 px the days are a vertical list and the pickers are bottom sheets; from 640 px the days are weekly columns and the pickers are centered modals (also on large windows).
- **Purpose:** decide and see what will be eaten each day, and learn at once which ingredients are missing. Address `/plan`; the browser tab is titled "Plan · My Food".
- **Entry points:** Plan in the main navigation; direct address; `/plan?add=<recipe id>`, from "Añadir al plan" of a recipe detail.
- **Functional composition:** CMP-main-navigation, CMP-app-shell, CMP-plan-calendar, CMP-recipe-picker, CMP-missing-ingredients, CMP-pending-changes, CMP-write-key, CMP-detail-layer (the recipe detail opened over the Plan).
- **Data & business rules:**
  - Shows the days from today (the device's date); a day before today is never shown on small windows, and in the current week of the weekly view it is dimmed, shows its recipes and offers no "Añadir" or X.
  - Each day has the slots Desayuno, Almuerzo and Cena, in that order. A slot holds any number of recipes, the same recipe may repeat, and they appear in the order of the file (all meals of that slot together). Free-text dishes are shown as plain text without photo, X or detail link. Snack meals in the file are kept and not shown. A recipe id that is not in the library is not shown.
  - A slot shows its marks first (Comer fuera, Pedir a domicilio: icon, label and an X, no photo and no detail link), then its recipes and text dishes. A slot with Comer fuera offers no "Añadir". Days before today show their marks dimmed and without X.
  - Small windows: today and the next 7 days (8 days); each time the end of the list is reached 7 more days are added, with no limit, also offline.
  - Medium and large windows: one week, Monday to Sunday, in seven columns that share the available width equally (132 px minimum; if they do not fit, the week scrolls sideways). A title shows the date range, with "Esta semana" for the current week, and today's column is highlighted. Buttons at the sides go to the previous and next week; the previous one is disabled in the current week (a past week cannot be reached) and the next one has no limit.
  - A planned recipe that Al has rated shows its rating mark after the title (display only); unrated recipes show nothing. The picker shows no rating.
  - Arriving with a recipe (`add` in the address, or "Añadir al plan" of a detail open over the Plan), the first time the picker opens, from any slot, it offers that recipe first (CMP-recipe-picker). The offer ends once the picker has opened, whether it adds or closes, and when Al leaves the Plan; an unknown id is ignored.
  - Tapping a recipe opens its detail over the Plan (full screen on small windows, a modal from 640 px) and closing it returns to the same place.
  - Data: recipes, ingredient catalog, pantry and plan from the stored library.
- **States (business meaning):**
  - Loading: placeholder blocks.
  - No library while offline, and error: as the recipe list, with "Reintentar".
  - Plan file missing: "El plan todavía no está disponible en Drive", with "Reintentar" and no way to add or remove.
  - Offline: the stored plan is shown; changes wait on the device (CMP-pending-changes).
  - Empty slot: only its name and "Añadir".
- **Related flows:** FLW-add-recipe-to-plan, FLW-remove-plan-recipe, FLW-mark-plan-out, FLW-browse-plan, FLW-enter-write-key.
- **Source:** `008_meal-plan-calendar_prd.md`, `008_meal-plan-calendar_ux_flow.md`; implementation in `src/components/plan/` and `src/app/plan/page.tsx`.

### Functionally-Significant Components

#### CMP-plan-calendar Day list, weekly columns and slots

- **Design system reference:** `RecipePhoto`, `SyncBadge`, `AppShell` (see `context/ui_kit_registry.md`); `PlanScreen`, `PlanDayList`, `PlanWeek`, `PlanSlot`, `PlanRecipeItem` and `PlanOutItem` are registered there.
- **Functional role:** shows the days and their slots and offers "Añadir", the X and the opening of a recipe.
- **Behavior rules:** as the data and business rules of SCR-plan. The X has the accessible name "Quitar <receta>" ("Quitar Comer fuera" / "Quitar Pedir a domicilio" for a mark); "Añadir" names its slot and day and is not shown when the slot has Comer fuera.
- **Used on:** SCR-plan.
- **Source:** `008_meal-plan-calendar_prd.md`, `_ux_flow.md`; implementation in `src/components/plan/` and `src/lib/domain/plan-view.ts`, `plan-calendar.ts`.

#### CMP-recipe-picker Recipe picker

- **Design system reference:** `Sheet`, `SearchInput`, `Button`, `PlanOutOptions`.
- **Functional role:** chooses one recipe for a slot, or marks the slot as eaten out or ordered in.
- **Behavior rules:**
  - Titled "Añadir al desayuno / almuerzo / a la cena" with the day. A search box ("Buscar receta"), the library list (photo, title, total time) and "Añadir receta".
  - Search: 3 characters minimum, applied 1 second after the last keystroke or on Enter; "x" and Esc clear it. Case and accents are ignored and every word must be in the title. With fewer than 3 characters the whole library shows. No match shows "Sin resultados" and keeps the selection; an empty library shows "No hay recetas todavía".
  - One recipe at a time: tapping another moves the choice, tapping the chosen one clears it. "Añadir receta" is enabled only with a choice.
  - With a recipe of origin (see SCR-plan) it is first in the list, already chosen and tagged "Tu receta", so "Añadir receta" is enabled; search, the rest of the list and changing the choice work as always. A search that does not match it hides it like any other recipe, and it is first again when the search clears.
  - Recipes that are Descartadas are neither listed nor found by the search, except the recipe of origin; Probadas and Por probar are, and Por probar recipes are planned like any other. There is no status control. A recipe already in the plan stays there whatever its status.
  - Above the search box, a row with "Salir fuera" and "Pedir". Tapping one marks the slot (FLW-mark-plan-out) and closes the picker, whatever recipe is chosen. "Salir fuera" is disabled when the slot holds any dish; "Pedir" is disabled when the slot already has Pedir a domicilio. Both count the changes still pending on the device.
  - Esc, the backdrop or the close button close it and add nothing. Resizing across 640 px keeps the text and the choice.
- **Used on:** SCR-plan.
- **Source:** `008_meal-plan-calendar_prd.md`, `_ux_flow.md`; implementation in `src/components/plan/RecipePickerSheet.tsx`.

#### CMP-missing-ingredients Missing ingredients

- **Design system reference:** `Sheet` without the close button, CMP-ingredient-groups.
- **Functional role:** after a recipe is added, shows where each of its ingredients stands and offers to put the Faltan ones on the shopping list.
- **Behavior rules:**
  - Opens only when Faltan is not empty (see the glossary for the three groups). It says "En tu despensa te faltan estos ingredientes:" and shows CMP-ingredient-groups.
  - "Continuar" leaves the shopping list as it is. "Añadir a mi lista de la compra" turns "Comprar" on for the Faltan ingredients only.
  - Esc or the backdrop do the same as "Continuar". The recipe stays in the plan in every case. The write key, if needed, is asked after this sheet closes.
- **Used on:** SCR-plan.
- **Source:** `008_meal-plan-calendar_prd.md`, `_ux_flow.md`; implementation in `src/components/plan/MissingIngredientsSheet.tsx` and `src/lib/domain/plan-view.ts`.

### Flows

#### FLW-add-recipe-to-plan Add a recipe to the plan

- **Goal / trigger:** plan a recipe for a slot of a day, from the Plan or from the recipe's detail.
- **Screens involved (in sequence):** (from a detail: SCR-recipe-detail → ("Añadir al plan") →) SCR-plan → ("Añadir" of a slot; with a recipe of origin the picker offers it first, chosen) → CMP-recipe-picker → ("Añadir receta") → SCR-plan with the recipe at the end of the slot → (if Faltan is not empty) CMP-missing-ingredients → SCR-plan → (if the device has no key) CMP-write-key.
- **Business rules governing the flow:** the recipe shows at once and goes to the outbox with the same sending, key and retry rules as FLW-flip-switch. The server applies the change to the latest `plan.yaml`, retrying once on a conflict: the dish goes to the last meal of that slot on that day, or a new meal is created in slot order (breakfast, lunch, snack, dinner); days stay in date order; everything the app does not manage is kept; `updated` is set with offset `-05:00`. In a batch with pantry changes, the pantry is written first and the plan last.
- **Edge cases & error handling:** an unknown recipe, a bad date, a slot other than breakfast, lunch or dinner, a slot that has Comer fuera, or a day earlier than yesterday in `-05:00` is rejected, the recipe leaves the screen and a 4-second notice says "No se pudo guardar <receta>". A missing or unreadable plan file rejects only the plan changes. A repeated conflict or a Drive outage keeps the change pending. The server remembers for 10 minutes which plan changes it applied, so a retry does not add the recipe twice (best effort, per server instance). The other phone sees the change at its next sync; changes from two phones to the same slot both survive.
- **Source:** `008_meal-plan-calendar_prd.md` (§5, §8, §10), `008_meal-plan-calendar_ux_flow.md`, ADR 003.

#### FLW-remove-plan-recipe Remove a recipe from the plan

- **Goal / trigger:** take a recipe out of a slot.
- **Screens involved (in sequence):** SCR-plan → (X of a recipe) → SCR-plan without it.
- **Business rules governing the flow:** removes one occurrence at once, with no confirmation and no undo, and queues the change. The server removes one dish with that recipe from the slot's meals; a meal left with no dishes, and a day left with no meals, are removed too. The shopping list is not touched.
- **Edge cases & error handling:** removing something that is no longer there changes nothing. Pending, key and rejection behave as in FLW-add-recipe-to-plan.
- **Source:** `008_meal-plan-calendar_prd.md` (§5, §10), `008_meal-plan-calendar_ux_flow.md`.

#### FLW-mark-plan-out Mark or unmark a slot as eaten out or ordered in

- **Goal / trigger:** say that a meal will not be cooked at home, or undo it.
- **Screens involved (in sequence):** SCR-plan → ("Añadir" of a slot) → CMP-recipe-picker → ("Salir fuera" or "Pedir") → SCR-plan with the mark first in the slot → (if the device has no key) CMP-write-key; SCR-plan → (X of a mark) → SCR-plan without it.
- **Business rules governing the flow:** the mark shows at once and goes to the outbox with the same sending, key and retry rules as FLW-flip-switch; removal has no confirmation and no undo. The server applies it to the latest `plan.yaml`, retrying once on a conflict: Comer fuera gets a meal of its own in slot order, only in a slot with no dishes; Pedir a domicilio is added to the last meal of the slot (or a new one), never next to Comer fuera and only once; a mark already there changes nothing. Removing a mark removes the meal or day it leaves empty. The pantry and the shopping list are never touched and the missing-ingredients sheet never opens.
- **Edge cases & error handling:** a rule broken on the server (for example, a recipe added on the other phone just before Comer fuera) rejects the change, the mark leaves (or comes back, for a removal) and a 4-second notice says "No se pudo guardar Comer fuera" / "No se pudo guardar Pedir a domicilio". Marks written by food-manager show the same way, including files where a slot's meals mix Comer fuera and recipes (all are shown, with no "Añadir").
- **Source:** `014_plan-eat-out-delivery_prd.md` (§5, §6, §10), `014_plan-eat-out-delivery_ux_flow.md`, ADR 005.

#### FLW-browse-plan Browse days and weeks

- **Goal / trigger:** see further days of the plan.
- **Screens involved (in sequence):** SCR-plan → (small: reach the end of the list / from 640 px: next or previous week) → SCR-plan showing other days.
- **Business rules governing the flow:** see SCR-plan. The earliest reachable day is today (small windows) or the Monday of the current week; there is no later limit. The week and the loaded days reset when the section is left or the screen is reloaded. If midnight passes while the app is open, the new day is taken at the next focus.
- **Edge cases & error handling:** loading more days offline is never blocked. Resizing the window between the two layouts keeps the plan and any open picker.
- **Source:** `008_meal-plan-calendar_prd.md` (§5, §10), `008_meal-plan-calendar_ux_flow.md`.

---

## Domain: profile

### Overview

Perfil: Al's favorite recipes and the heart that marks them. Favorites are saved to `reviews/al.yaml` in Drive through the same operations, offline queue and write key as the pantry and the plan. Al's ratings are shown on the rows and filterable here, and are set from the recipe detail (FLW-rate-recipe). Comments, the "curated" flag and the person picker are not part of this domain yet; the person is always Al.

### Screens / Pages

#### SCR-profile Perfil

- **Platform:** Web, one column in every layout.
- **Purpose:** see and manage Al's favorite recipes. Address `/profile`; the browser tab is titled "Perfil · My Food".
- **Entry points:** Perfil in the main navigation; direct address; "Ver recetas" is the way out, to SCR-library-list.
- **Functional composition:** CMP-app-shell, CMP-recipe-search, CMP-recipe-filters, CMP-favorite-button, CMP-pending-changes, CMP-write-key, SCR-recipe-detail.
- **Data & business rules:**
  - A tab bar with a single tab, "Recetas favoritas", selected. Under it, the search bar and the eight filters of Recetas, working only among the favorites (filter options and counts are computed over them). Estado starts on Probadas here too, independent of Recetas; a favorite that is Descartada or Por probar stays in the file and shows when Estado is changed or removed.
  - The list shows the favorite recipes in the same row format as SCR-library-list (photo or fallback tile, title, category and rating mark), ordered like Recetas (best rated first, unrated last, ties alphabetical, no rating order while a search is applied), each with its heart filled. "N cambios pendientes" shows while changes wait.
  - Tapping a heart unmarks the recipe; its row stays, dimmed with an empty heart, until the search or the filters change or Perfil is left, and can be marked again. Nothing else reorders.
  - Tapping a row opens SCR-recipe-detail over Perfil without changing the address (full screen on small windows, modal on medium and large). Closing returns to Perfil as it was.
  - Search text and filters are emptied when Perfil is left or reloaded; Estado returns to Probadas.
- **States (business meaning):**
  - Loading: "Cargando tus recetas…".
  - No library and offline, or error: the same messages as the list, with "Reintentar".
  - No favorites: "Aún no tienes favoritas", with the hint "Toca el corazón de una receta para guardarla aquí." and the button "Ver recetas".
  - Favorites: the list described above.
  - No results: "Ninguna receta coincide" with "Borrar búsqueda" and "Quitar filtros" as they apply.
- **Related flows:** FLW-toggle-favorite, FLW-switch-section.
- **Source:** `009_favorites_prd.md` / `_ux_flow.md`, `011_recipe-status-filter_prd.md` / `_ux_flow.md`, `012_recipe-ratings_prd.md` / `_ux_flow.md`; implementation in `src/components/profile/ProfileScreen.tsx`.

### Functionally-Significant Components

#### CMP-favorite-button Favorite button

- **Design system reference:** `FavoriteButton`, `components/recipes/FavoriteButton` (see `context/ui_kit_registry.md`).
- **Functional role:** the heart that marks or unmarks a recipe as a favorite.
- **Behavior rules:** filled when the recipe is a favorite, empty when not, with the state also stated to assistive technology. Icon-only in rows; in the detail with the text "Añadir a favoritos" or "Quitar de favoritos": spanning the full width of the content on small windows, with the width of its content under the photo on medium and large windows. Its touch area is at least 44 px. It never opens the recipe it belongs to, and all hearts of the same recipe agree at once.
- **Used on:** SCR-library-list, SCR-recipe-detail, SCR-profile.
- **Source:** `009_favorites_prd.md` (US-1, US-2), `009_favorites_ux_flow.md` (§2.4); implementation in `src/components/recipes/FavoriteButton.tsx`.

### Flows

#### FLW-toggle-favorite Mark or unmark a favorite

- **Goal / trigger:** Al taps a heart, or the button under the photo of a recipe.
- **Screens involved (in sequence):** SCR-library-list, SCR-recipe-detail or SCR-profile → the same screen with the new state.
- **Business rules governing the flow:** the new state shows at once and is saved to `favorites` of `reviews/al.yaml`. Offline, or while Drive is unavailable, the change waits on the device and is sent in order when possible. Toggling the same recipe several times while pending ends with the last state, and returning it to the saved state sends nothing. With no key on the device, the change stays pending and the write key dialog (CMP-write-key) opens at the first toggle; "Ahora no" leaves it pending, with "Introducir clave" in the pending indicator. The server writes only `favorites` and `updated` of the file and keeps ratings, comments and the layout (ratings have their own flow, FLW-rate-recipe).
- **Edge cases & error handling:** if the server rejects a change (for example the recipe no longer exists) the heart returns to the saved state and "No se pudo guardar <receta>" shows for 4 seconds. If `reviews/al.yaml` does not exist, toggling is refused with the same notice and the app never creates the file. A favorite whose recipe no longer exists is not shown and is not removed from the file.
- **Source:** `009_favorites_prd.md` (US-4, US-5, §10).
