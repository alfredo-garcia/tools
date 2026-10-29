# Main Navigation

> Project: `my-food-manager`
> MVP: no (post-MVP; the product vision v2 is pending) — Backlog item: new, not in backlog

* **Feature Name:** Main navigation between Recetas, Plan, Despensa and Perfil.

* **Goal:** Let Al and his household partner move between the areas of the app in one tap, from any screen and on any device, so the areas that come next (meal plan, pantry and shopping list, profile) have a place to live without redesigning the structure of the app.

* **The Delta:** Today the app is a single screen: the recipe list at `/`, with the recipe detail over or beside it. There is no persistent navigation and no other area to go to.

* **User Persona:** Al (planner-cook) and his household partner, on the phone daily and on desktop occasionally.

* **Core Mechanics (High Level):**
  - On small windows (under 640 px), a fixed bottom bar with four buttons, each with an icon and text: Recetas, Plan, Despensa and Perfil. The button of the current section is highlighted.
  - From 640 px up, a left sidebar with the same four options. It can be collapsed (icons only) or expanded (icons and text). It starts expanded on large windows and collapsed on medium ones, and remembers the last choice on each device.
  - Each option goes to its own address: Recetas at `/`, Plan at `/plan`, Despensa at `/ingredients` and Perfil at `/profile`. Plan, Despensa and Perfil show only a "Próximamente" message.
  - While a recipe detail is open on a small window, the bottom bar is hidden; on the recipe list it stays visible.
  - The recipe list, its filters, its search and the recipe detail keep working as they do today.

* **Constraints / Out of Scope:**
  - No real content in Plan, Despensa or Perfil, only "Próximamente". The Despensa/Lista tabs, the calendar plan, the pantry, the shopping list, and the profile content (user, favorites, ratings) are defined in other features.
  - No "who am I" picker, no badges or counters on the options, and no change to the sync indicator or the offline status.
  - No change to the existing addresses of the recipe list and the recipe detail.
