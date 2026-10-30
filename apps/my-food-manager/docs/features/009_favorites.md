# Favorites

> Project: `my-food-manager`
> MVP: no (stage 2, Product Vision §5/§7) — Backlog item: #9 Profile (favorites part only; the person picker, ratings, comments and "curated" stay out)

* **Feature Name:** Favorite recipes: a heart on every recipe in the list and in the detail to add or remove it from Al's favorites, and a "Recetas favoritas" tab in Perfil that lists only them.

* **Goal:** Let Al mark the recipes he loves with one tap from wherever he sees them, and come back to just those in one place, with the same search and filters he already knows. Success: a recipe is marked or unmarked in one tap from the list or the detail, the mark survives a reload and reaches Drive (also when made offline), and Perfil shows exactly the favorites, searchable and filterable.

* **The Delta:** Today the recipes are read-only: there is no way to say "this one is a favorite" (the data already has room for it in Al's reviews file, but the app never shows or writes it), and Perfil shows only "Próximamente".

* **User Persona:** Al (planner-cook), mostly on the phone, also on a larger screen at home. Favorites are Al's own, saved in his reviews file; the household partner is not covered yet (see Constraints).

* **Core Mechanics (High Level):**
  - Every row of the recipe list shows a heart at its right: filled when the recipe is a favorite, outline when not. Tapping it toggles the state without opening the recipe.
  - The recipe detail shows the same heart on the title row, at the right, taking its space from the name (the name wraps in the rest of the width). On medium and large windows, the detail instead shows a button under the photo with the heart and the text "Añadir a favoritos" or "Quitar de favoritos".
  - Perfil gets a tab bar with a single tab, "Recetas favoritas", which lists only the favorite recipes in the same row format as Recetas, with the same search bar and filters, the same heart to remove a favorite, and a tap on the row to open the recipe detail.
  - A change shows on screen at once and is saved to Al's reviews file in Drive; offline, it waits on the device and is sent in order on reconnection with the shared write key, as for the pantry and the plan.

* **Constraints / Out of Scope:**
  - Only Al's favorites (`reviews/al.yaml`): no "who am I" picker and no partner favorites until the Perfil feature; the app never creates the reviews file.
  - Ratings, comments and the "curated" flag are not shown or written.
  - No favorites filter or heart in the Plan picker, no "favorites" inspiration view, no sorting by favorite in Recetas.
  - Nothing changes in the recipe files; the favorites list in Drive is the only thing written (plus its `updated`).
  - No real-time sync with the other phone; last change wins.
