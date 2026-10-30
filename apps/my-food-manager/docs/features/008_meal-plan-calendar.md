# Meal Plan Calendar

> Project: `my-food-manager`
> MVP: no (stage 2, Product Vision §5/§7) — Backlog item: #6 Meal-plan calendar (Plan)

* **Feature Name:** Plan section: a calendar from today onward where Al and his partner assign recipes to Desayuno, Almuerzo and Cena of each day, with a pantry check on every recipe added.

* **Goal:** Let the household decide in a couple of minutes what will be eaten on each day, see it at a glance, and learn right away which ingredients are missing so they can be put on the shopping list. Success: a week can be planned in one sitting on the phone, the plan survives a reload and reaches Drive (so the other phone sees it), and every recipe added with missing ingredients offers to put them on the list.

* **The Delta:** Today the Plan item of the navigation shows only "Próximamente". There is no way to record which recipe will be cooked when, and nothing connects a chosen recipe with the pantry.

* **User Persona:** Al (planner-cook) and the household partner, mostly on the phone; also on a larger screen at home.

* **Core Mechanics (High Level):**
  - The Plan shows days from today onward. Each day has three slots: Desayuno, Almuerzo, Cena. Past days are never shown or editable.
  - Each slot has an "Añadir" action that opens a recipe picker (bottom sheet on mobile, modal on medium and large screens) with a search box that filters recipes. Selecting a recipe enables "Añadir receta"; confirming closes the picker and shows the recipe in that slot.
  - A slot holds any number of recipes (the same recipe may repeat), and each one can be removed with an X / trash control. Removing never changes the shopping list.
  - When a recipe is added, its ingredients are checked against the pantry ("Tengo" / "No tengo"; staples count as available). If something is missing, a second sheet/modal says "En tu despensa te faltan estos ingredientes:" with the list and two buttons: "Continuar" (keeps the recipe in the plan, shopping list untouched) and "Añadir a mi lista de la compra" (keeps the recipe in the plan and marks every missing ingredient as "Comprar").
  - Mobile: days and slots stacked vertically; it opens with today plus the next 7 days and loads 7 more each time the user scrolls to the end, with no limit.
  - Medium and large screens: one column per day showing a Monday–Sunday week, with side buttons to go to the next or previous week. Going back is disabled at the current week; going forward has no limit; days already past in the current week appear dimmed and not editable.
  - The plan is one shared household agenda saved to Drive; changes apply on screen at once and, offline, wait on the device and are sent in order on reconnection, with the shared write key, as in the pantry switches.

* **Constraints / Out of Scope:**
  - Recipes only: no free-text entries, no portions or servings, no times of day, no notes.
  - No drag and drop, copy of days or weeks, templates, or reordering within a slot.
  - The shopping list is not generated or recalculated from the plan; this feature only marks the missing ingredients of a recipe at the moment it is added. Removing a recipe, or later pantry changes, do not update the list. The plan-driven list and "bought items refill the pantry" remain backlog #8.
  - No editing of past days, no history view.
  - One plan for the whole household (no per-person plans); no real-time sync, last change wins.
  - Needs a new storage domain in Drive and an ADR before implementation (Product Vision §9, §11): the schema is extended with the food-manager skill, and the app's write scope grows beyond what tech_standards §5 allows today.
