# Recipe Detail Shortcuts

> Project: `my-food-manager`
> MVP: no (stage 2) — Backlog item: new, not in backlog (connects #3 Recipe detail, #6 Plan and #8 Shopping list)

* **Feature Name:** Recipe Detail Shortcuts: add to shopping list and add to plan.

* **Goal:** Let Al go from a recipe he is looking at to "I will cook it" without re-finding it. Success: from
  the detail, in a few taps, he puts what the recipe lacks on the shopping list, or starts planning the
  recipe into a slot with the recipe already waiting at the top of the picker.

* **The Delta:** Today the detail only shows the recipe (with rating, favorite and share). To buy what is
  missing, Al must plan the recipe first (the missing-ingredients sheet only appears after adding to the
  Plan) or flip switches in Despensa one by one. To plan a recipe, he must go to the Plan, open a slot and
  search for the recipe again.

* **User Persona:** Al (planner-cook), mostly on the phone, also on desktop, online or offline.

* **Core Mechanics (High Level):**
  - The detail gets two contextual buttons: "Añadir a lista de compra" and "Añadir al plan". Both show in
    every recipe status, Descartada included.
  - "Añadir a lista de compra" opens a modal (bottom sheet on small windows) with the recipe's ingredients in
    three groups. "Faltan": not in the pantry as "Tengo" and not on the shopping list. "En mi lista de la
    compra": not "Tengo" and already on the list. "Ya tengo": "Tengo" in the pantry; "Tengo" wins when an
    ingredient is also on the list, and staples (always available) count as "Ya tengo".
  - "Añadir ingredientes faltantes" puts the "Faltan" group on the shopping list and closes; the other two
    groups are informational. "Cancelar" or "Atrás" closes without changes. Either way Al is back on the
    detail.
  - "Añadir al plan" takes Al to the Plan carrying the recipe. The first time he opens the picker from any
    slot's "Añadir", that recipe is first in the list, highlighted so it is clear it is the one he came with,
    and already chosen. The rest of the picker (search box, the full list, changing the choice) works as
    today, so he can change his mind. The suggestion is lost once the picker has been opened once, whether he
    adds or closes it.
  - The missing-ingredients sheet that follows adding a recipe to the Plan uses the same three groups and the
    same "Faltan" rule as the modal of the detail.
  - Planning rule, stated explicitly: Por probar recipes can be added to the Plan (as today). The recipe he
    came from is offered even if it is Descartada; other Descartada recipes stay out of the picker.

* **Constraints / Out of Scope:**
  - No new kind of write: the shopping list uses the same "Comprar" switch and offline queue as Despensa;
    the plan uses the existing add operation.
  - Choosing day and slot stays in the Plan (the existing "Añadir" of each slot); the detail does not ask for
    them.
  - "En mi lista de la compra" and "Ya tengo" are informational: no switches in the modal, no removing items
    from the list from it, no quantities.
  - No change to the Plan's other functions, to the filters, or to what a planned recipe shows.
