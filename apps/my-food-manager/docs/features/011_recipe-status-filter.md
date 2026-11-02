# Recipe Status Filter

> Project: `my-food-manager`
> MVP: no (stage 2) — Backlog item: #11 (Should)

* **Feature Name:** Recipe Status Filter.

* **Goal:** Let Al or his partner separate the recipes they have cooked and kept from new ideas and from
  recipes they discarded, so the everyday library only shows what works. Success: the library opens showing only
  tried recipes, and new ideas or discarded recipes are one filter change away.

* **The Delta:** Today every recipe in the library looks the same. A freshly captured idea sits next to
  recipes that have been cooked many times, and a recipe Al no longer wants can only be ignored.

* **User Persona:** Al (primary) and the household partner, choosing what to cook, on a phone or desktop,
  online or offline.

* **Core Mechanics (High Level):**
  - Each recipe has a status, shared by the whole household: Por probar (a new idea), Probada (cooked and kept)
    or Descartada (not wanted). A recipe with no status is Probada. The status is set outside the app, by the
    food-manager skill (new recipes arrive as Por probar; rating one makes it Probada; "borrar" makes it
    Descartada and keeps the file). The app only reads it.
  - A seventh filter, Estado, joins the existing six in the Recetas list. It starts on "Probadas" every time the
    list opens and has two more options, "Por probar" and "Descartadas", each with its recipe count.
  - Removing Estado with its "x" applies no status filter, so recipes of every status show. "Limpiar" clears all
    filters, Estado included, like any other filter.
  - The favorites in Perfil have the same Estado filter with the same default.
  - The recipe picker of the Plan gets no filter: it lists Probadas and Por probar and never offers Descartadas.
  - Recipes already in the Plan stay visible whatever their status.
  - The search respects the chosen status. Everything is computed on the device from the stored library, so it
    works offline.

* **Constraints / Out of Scope:**
  - The app does not write `status`: no "La probé" button, no automatic change to Probada when rating (they come
    with the ratings feature).
  - No status badge on the rows, no sorting, no saved filter choice across reloads.
  - No change to how favorites or ratings are stored; a favorite that is Descartada stays in the file.
  - No filters or status controls in the Plan.
  - No new endpoints or libraries; recipes schema 4 (`status`) already exists in the food-manager contract.
