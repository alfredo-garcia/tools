# Filter Panel and Family Grouping

> Project: `my-food-manager`
> MVP: no (stage 2, Product Vision §7) — Backlog items: #2 (recipe filters), #8 (shopping list grouped by family, bought updates pantry), #9 (favorites), #11 (status filter)
> Epic: none · Issue: n/a

* **Feature Name:** Filter panel and family grouping

* **Goal:** Al gets a clean list on opening Recetas, Compra and Despensa (every recipe, every
  ingredient, no filter row taking space) and narrows or groups it only when he wants to; in the
  shop, ticking off what he bought leaves the pantry up to date with no second step.

* **The Delta:** Today Recetas (and the favorites of Perfil) open with Estado on "Probadas" and the
  eight filters always visible under the search; there is no filter by favorites. Compra rows show
  only "Comprar", and turning it off strikes the row through without touching "Tengo", so the pantry
  must be fixed by hand in Despensa. Compra and Despensa show the family filter always, and the
  ingredients only as one alphabetical list.

* **User Persona:** Al, browsing recipes at home and using Compra in the shop; the household partner
  uses the same screens.

* **Core Mechanics (High Level):**
  - Recetas and the favorites of Perfil open with no filter at all: Estado has no initial value and
    every status shows.
  - Recetas gains a "Favoritos" filter with two options, "Favoritos" and "No favoritos". It is not
    offered in Perfil, where every recipe is a favorite.
  - In Recetas and Perfil the filters are hidden behind a filter icon next to the search. The icon
    shows or hides them, shows how many filters are active, and the count "N de M recetas" and
    "Limpiar" stay visible while the filters are hidden.
  - Compra rows gain the "Tengo" switch, working as in Despensa.
  - In Compra, turning "Comprar" off also turns "Tengo" on. If the struck-through row is turned
    back on in the same visit, "Tengo" returns to its earlier value.
  - In Compra and Despensa a filter icon next to the search shows or hides the family filter and a
    new "Agrupar por familia" option. With it on, the ingredients are grouped under one heading per
    family with its count, in vocabulary order, with "Otros" last. In Despensa the "Todos / Tengo /
    No tengo" filter stays always visible, outside the panel.
  - Nothing is remembered: leaving a section or reloading hides the panel and resets filters,
    grouping and search, as today.

* **Constraints / Out of Scope:**
  - Turning "Comprar" off in Despensa does not change "Tengo"; the switches stay independent there.
  - No new filters other than Favoritos; no change to the options or behavior of existing filters
    other than Estado's lack of a default.
  - No grouping in Recetas or Perfil, and no grouping option other than by family.
  - No change to the shared shopping-list text (it is already grouped by family) or to the Plan's
    picker (Descartadas stay out).
  - No saved preferences per device or per person (panel open, grouping, filters).
  - No change to what is written to Drive: only the existing "Tengo" and "Comprar" switch changes.
