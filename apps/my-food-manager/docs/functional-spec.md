# My Food Manager — Master Functional Documentation

> Project: `my-food-manager`

> Entry point. While the product is small, this file contains everything inline, using the
> domain structure repeated under `##` headers. As domains grow, they move to their own
> files under `docs/functional/domains/` and this file becomes a map plus the shared reference.

## 1. Product Overview

My Food Manager is a personal, visual, mobile-first web app (installable PWA) that helps Al and his household partner decide what to cook and shop without forgetting anything. It reads the Google Drive folder `food`, which the food-manager skill maintains, and keeps working without a connection. There are no logins. Platform: web only.

Today only the data layer and a proof screen exist. Browsing, pantry, shopping list and reviews are the next features (see `product/product_vision.md` §7).

## 2. How to Read This Documentation

- **ID scheme:** `SCR-` for screens, `FLW-` for flows, `CMP-` for functionally-significant components.
- **Platform notation:** every screen states its platform. A "Platform divergence" note appears only where behavior differs.
- **Source:** every entry names where it came from (feature PRD, and UX Flow when one exists).
- **Scope:** this document describes what the product does and why. Visual specs live in `context/ui_standards.md` and `context/ui_kit_registry.md` and are only referenced here.

## 3. Domain Map

| Domain | One-line description | File | Status |
|---|---|---|---|
| library | Library sync, offline storage and the recipe list | inline below | Active |

## 4. Navigation Structure

There is no persistent navigation yet. The app has a single screen at `/`. The bottom bar (mobile) and sidebar (desktop) arrive with the browse feature (backlog #2).

## 5. Screen & Flow Index

**Screens**

| ID | Name | Domain | Platform |
|---|---|---|---|
| SCR-library-list | Recipe list (proof screen) | library | Web |

**Flows**

| ID | Name | Domain(s) | Platform |
|---|---|---|---|
| FLW-first-sync | First load | library | Web |
| FLW-library-refresh | Keeping the library fresh | library | Web |

## 6. Cross-Cutting Concepts

- **Read-only.** The app writes nothing to Drive. Writes arrive with the pantry and reviews features.
- **Offline-first.** After the first sync, the library is always shown from the device, before any network response. Reads are never blocked by a missing connection.
- **Freshness.** A sync runs on app open, every 5 minutes while the app is visible and online, within 5 seconds of regaining a connection, and on a manual request. If Drive has no changes, only the "last synced" time updates. A failed sync leaves the stored data untouched.
- **Invalid data.** A malformed recipe file is skipped and counted as a warning. It never breaks the rest of the library.
- **Access.** No login. Read endpoints are open, which is accepted for low-sensitivity personal data.

## 7. Shared Functional Components

None shared across domains yet.

## 8. Shared Data Entities

- **Library snapshot.** The complete normalized copy of the `food` folder: recipes (with steps, notes and variations), the ingredient catalog, the pantry, each person's reviews, the vocabularies (categories, tags, units, families) and the list of household people. The people are derived from the review files that exist. The snapshot is replaced as a whole on every sync that finds changes.

## 9. Cross-Domain Flows

None.

## 10. Global Glossary

- **Snapshot:** the normalized library.
- **Fallback tile:** the category-colored tile shown when a recipe has no photo.

## 11. Recent Changes

- 2026-10-29 — library: Drive sync and offline library (see `changelog/001_drive-sync-offline-library_changelog.md`).

---

## Domain: library

### Overview

How data travels from Drive to the device, and how its state is shown. It is the base for every other feature.

### Screens / Pages

#### SCR-library-list Recipe list (proof screen)

- **Platform:** Web
- **Purpose:** show that the library is loaded and fresh. Provisional until the browse feature replaces it.
- **Entry points:** opening the app (`/`); FLW-first-sync.
- **Functional composition:** CMP-app-shell, CMP-sync-badge, CMP-recipe-photo.
- **Data & business rules:** lists recipes alphabetically by title (Spanish collation). Each row shows the photo or fallback tile, the title and the category name. Above the list: the recipe count and, when there are any, "N con avisos". There are no filters or search. If the browser cannot store data, a notice says that offline only shows what is already loaded.
- **States (business meaning):**
  - Loading: no stored library and the first sync is running; "Cargando tus recetas…".
  - Offline with no data: "Necesitas conexión la primera vez", with a "Reintentar" button.
  - Error with no data: "No se pudo cargar tu biblioteca", with a "Reintentar" button.
  - Empty: a stored library with no recipes; "No hay recetas todavía".
  - List: the stored library is shown immediately, online or offline.
- **Related flows:** FLW-first-sync, FLW-library-refresh.
- **Source:** `001_drive-sync-offline-library_prd.md` (no UX Flow exists for this feature); implementation in `src/app/page.tsx`.

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
- **Used on:** SCR-library-list.
- **Source:** `001_drive-sync-offline-library_prd.md`; implementation in `src/components/recipes/RecipePhoto.tsx`.

#### CMP-app-shell Page frame

- **Design system reference:** `AppShell`, `components/layout/AppShell` (see `context/ui_kit_registry.md`).
- **Functional role:** page frame with the title, the sync badge and the refresh control.
- **Behavior rules:** the refresh button is always available and is disabled while a sync runs. On touch devices, pulling down from the top of the page forces a sync. A failed manual refresh shows a notice and keeps the stored data.
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
