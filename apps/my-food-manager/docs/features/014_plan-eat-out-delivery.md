# Plan: Eat Out and Delivery

> Project: `my-food-manager`
> MVP: no, stage 2 (Product Vision §5/§7). Backlog item: #6 (Meal-plan calendar), extension of my-food-manager/008

* **Feature Name:** Eat out and delivery in the Plan

* **Goal:** Al can see at a glance which meals of the week will not be cooked at home, so the plan
  reflects reality and nobody plans or shops for a meal that will be eaten out or ordered.

* **The Delta:** Today a Plan slot can only hold recipes. A meal eaten out or ordered in is left
  empty, and an empty slot looks the same as a slot nobody has planned yet. The schema already
  supports `out` dishes (`eat-out`, `delivery`), but the app ignores them when reading and cannot
  write them.

* **User Persona:** Al, the planner-cook (primary); the household partner sees the same plan.

* **Core Mechanics (High Level):**
  - The picker that opens from "Añadir" in any slot shows two options in one row before the
    search: "Salir fuera" and "Pedir". Choosing one marks that slot of that day as eat-out or
    delivery.
  - "Salir fuera" is only possible in an empty slot. Once set, the slot takes no more recipes and
    no "Pedir", and offers no "Añadir".
  - "Pedir" can share a slot with recipes and can be set before or after them. It appears at most
    once per slot, and "Salir fuera" is not offered while it is there.
  - In the Plan view each mark shows its own distinctive icon and the schema label ("Comer fuera",
    "Pedir a domicilio"), so it is clear that this meal is not cooked. Each mark is removed with
    the X, without confirmation, like a recipe.
  - Marks made in Drive by food-manager (Claude/Telegram) show in the Plan in the same way.

* **Constraints / Out of Scope:**
  - Slot by slot only: no "whole day out" action.
  - Marking or unmarking never changes the pantry or the shopping list, and an `out` mark never
    opens the missing-ingredients sheet.
  - No restaurant name, notes, labels or any detail on the mark; only the two `out` values in the
    schema.
  - Snack meals stay hidden, as today; no new slots.
  - Free-text dishes are still read-only; this feature does not let the app create them.
