# Recipe Ratings

> Project: `my-food-manager`
> MVP: no (stage 2) — Backlog item: #9 Profile (ratings part only; the person picker, comments and "curated" stay out)

* **Feature Name:** Recipe Ratings.

* **Goal:** Let Al give a recipe from 1 to 5 stars from the app, see his ratings wherever he browses recipes, and
  find his best recipes first. Success: a rating is created, changed or removed in two taps from the detail,
  survives a reload and reaches Drive (also when set offline), and the library opens with the best-rated recipes
  on top.

* **The Delta:** Today ratings exist only in Al's reviews file (written by food-manager through chat). The app
  neither shows nor writes them, the library is sorted alphabetically, and a recipe rated outside the app looks
  the same as one never rated.

* **User Persona:** Al (planner-cook), mostly on the phone, also on desktop, online or offline. The ratings are
  Al's own (`reviews/al.yaml`); the household partner is not covered until the person picker exists.

* **Core Mechanics (High Level):**
  - The recipe detail shows five stars: all grey if the recipe has no rating, otherwise filled up to the rating.
    Tapping star N sets the rating to N (create or edit). Tapping the star that matches the current rating
    removes it.
  - Rows in Recetas, in the favorites of Perfil and in the Plan show the rating when the recipe has one, and
    nothing when it does not. It is display only: tapping the row opens the detail as before.
  - A new filter, Rating, joins the existing seven, with options "1+", "2+", "3+", "4+", "5" (exactly five
    stars) and "Sin rating". With no option chosen, every recipe shows. It composes with the other filters and
    the search.
  - Recetas and the favorites sort by rating from highest to lowest by default; recipes without rating go last
    and ties are alphabetical. The grouped search results and the Plan recipe picker keep their current order.
  - Rating a recipe whose status is Por probar or Descartada also sets it to Probada (recipes schema 4
    contract). A rating change shows at once, is saved to Drive, and waits in the offline queue with the shared
    write key, as favorites do.

* **Constraints / Out of Scope:**
  - Only Al's ratings (`reviews/al.yaml`); the app never creates that file. No person picker, no partner
    ratings, no averages.
  - No comments: existing comments and unknown fields are preserved, never shown or edited. Removing a rating
    removes its entry, so its comment goes with it.
  - No half stars and no sort control beyond the default order.
  - The app writes `status` only to move a recipe to Probada when it gets rated; it never sets Por probar or
    Descartada and never edits other recipe fields (needs an ADR, see tech_standards §5 and §12).
  - No real-time sync with the other phone; last change wins.
