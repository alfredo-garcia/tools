# Pantry and Shopping List Switches

> Project: `my-food-manager`
> MVP: no (stage 2, Product Vision §5/§7) — Backlog item: #7 Pantry, plus the "to buy" list of #8; first feature that writes to Drive

* **Feature Name:** Despensa section with two tabs, "Despensa" and "Lista de compra", where every ingredient has two independent switches, "Tengo" and "Comprar", saved to Drive.

* **Goal:** Let Al and his partner record in one tap whether an ingredient is at home and whether it must be bought, and trust that the change reaches Drive (and so the other phone, Claude and Telegram) even when made offline in the store. Success: a switch responds instantly, survives a reload, and a change made without connection is in Drive after reconnecting.

* **The Delta:** Today `/ingredients` shows only "Próximamente" and the app cannot write to Drive. The pantry (`have` and `to_buy`) can only be changed through Claude or Telegram, and no screen shows it.

* **User Persona:** Al (planner-cook) and the household partner, on the phone, at home and at the store.

* **Core Mechanics (High Level):**
  - A tab selector at the top switches between "Despensa" and "Lista de compra"; the second tab shows how many items are to buy.
  - Both tabs start with a search bar (3 letters minimum, "x" to clear, like the recipe search) and a filter by ingredient family, one family at a time.
  - "Despensa" tab: a "Tengo / No tengo / Todos" filter, "Tengo" by default. Each ingredient row has two switches, "Tengo" and "Comprar", independent of each other: any combination is valid.
  - "Lista de compra" tab: only the ingredients with "Comprar" on, with the family filter and nothing else. Turning "Comprar" off removes the ingredient from the list; the row stays struck through until leaving the tab, so a slip can be undone with one tap.
  - A switch applies on screen at once and is saved to Drive; offline, the change waits on the device and is sent, in order, when the connection returns. The screen shows pending and failed changes.
  - Saving needs the household's shared write key, asked once per device; without a valid key the change is kept pending, never lost.

* **Constraints / Out of Scope:**
  - Only `have` and `to_buy` of the pantry are written. No quantities, units or notes, no creating ingredients or editing the catalog, and no deleting files.
  - The two switches never change each other: turning "Tengo" on does not clear "Comprar" and vice versa. "Bought items move to the pantry" belongs to the plan-driven list (#8).
  - The list is not generated from the plan or from recipes; it is exactly what is marked.
  - No real-time sync: the other phone sees a change at its next sync. No conflict screen; the last change to an ingredient wins.
  - No bulk actions ("mark all"), no sorting options, no several families at once, and no change to the recipe list, filters or search.
