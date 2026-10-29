# Recipe Filters

> Project: `my-food-manager`
> MVP: yes (Product Vision §7) — Backlog item: #2 (Recipe browse, filters & search), narrowed to filters

* **Feature Name:** Recipe Filters.

* **Goal:** Let Al or his partner narrow and reorder the recipe list in a couple of taps by the six things
  they decide with: category, time, diet, cuisine, difficulty and protein. Success: from the list, any filter
  is set in two taps, cleared in one, and the list visibly rearranges itself.

* **The Delta:** Today the list shows every recipe alphabetically and there is no way to narrow it.

* **User Persona:** Al (primary) and the household partner, deciding what to cook, on a phone or desktop,
  online or offline.

* **Core Mechanics (High Level):**
  - A row of six small filters above the list, each showing only its name: Categoría, Tiempo, Dieta, Cocina,
    Dificultad, Proteína.
  - Tapping a filter opens its options; choosing one applies it. The filter then shows the chosen option and an
    "x"; tapping the "x" removes it and the filter goes back to showing only its name.
  - Filters combine (a recipe must match all active filters). One option per filter.
  - Filtering happens entirely on the device, over the stored library: it works offline and never calls the server.
  - The list reacts visually: recipes that stay glide to their new position, new ones fade in, the count updates.

* **Constraints / Out of Scope:**
  - No text search, no sorting options, no saved filters, no favorites/rating/"can cook now" filters.
  - No server-side filtering and no new endpoints.
  - No grid redesign: the list keeps its current rows.
  - Reuses existing components; new ones are added to the UI kit.
