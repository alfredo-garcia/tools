# Recipe Detail

> Project: `my-food-manager`
> MVP: yes (Product Vision §5/§7) — Backlog item: #3 (Recipe detail / cook view), narrowed to read-only viewing

* **Feature Name:** Recipe Detail.

* **Goal:** Let Al or his partner open any recipe and read everything they need to decide on it
  and to cook it, in one clear screen, without leaving the app. Success: from the recipe list,
  one tap shows the recipe's photo, its key facts at a glance (type, time, difficulty, servings,
  technique), its general info, its ingredients and its steps, on a phone or on a desktop, online
  or offline, and one gesture or click returns to the list exactly where the user left it.

* **The Delta:** Today the recipe list is a proof screen: each recipe shows only a photo, a title
  and a category, and tapping it does nothing. The recipe's ingredients, steps and notes exist in
  the library but cannot be seen in the app.

* **User Persona:** Al (primary, planner-cook) and the household partner (secondary), reading a
  recipe on a phone while deciding or cooking, or on a desktop.

* **Core Mechanics (High Level):**
  - Tapping a recipe in the list opens its detail. On desktop it opens as a large modal over the
    list with a close button; on mobile it opens as a full screen with a back button at the top.
  - Every recipe detail has its own address, so a device's back gesture or button closes the
    detail and returns to the list, and a recipe can be opened directly from a link, even offline.
  - A header shows the recipe's photo (the category tile when it has none), its title, and its key
    facts: category (type), a time group, difficulty, servings, and the cooking techniques as chips.
    The time group shows the total time and, when opened, the preparation, cooking and resting
    times. Any fact the recipe doesn't have is shown as "-" instead of being hidden.
  - On mobile, the header stays at the top while scrolling and shrinks to a compact bar with the
    back button and the recipe title only, so the user can always see what they are reading and go back.
  - Below the header, the content is organized in separate sections, all open by default, each with
    a chevron to collapse and expand it individually: general info, ingredients, steps, and notes.
  - General info gives context about the recipe: its cuisine, diet, main protein and occasion
    tags. A family the recipe has no tag for is shown as "-".
  - Ingredients appear grouped as the recipe groups them (e.g. dough, filling) and mark optional
    and to-taste items. An ingredient that is itself another recipe in the library is a link that
    opens that recipe's detail.
  - Steps are shown as a numbered list in the recipe's order.
  - Notes shows the recipe's notes, variations and source when they exist; the section is absent
    when there is nothing to show.

* **Constraints / Out of Scope:**
  - Read-only: no editing, rating, commenting, favoriting or "curated" toggle (backlog #8).
  - No action buttons in this version: no "pick to cook", no "add to shopping list" (backlog #5, #7).
  - No pantry information on ingredients and no "Pantry" panel: have/missing status belongs with
    the pantry and shopping-list features.
  - No keep-screen-on, no step-by-step mode, no checking off steps: that is a later "Cook" feature.
  - No serving scaling or unit conversion: quantities are shown as written in the recipe.
  - No previous/next recipe navigation.
  - The recipe's data-quality flags (missing fields, doubts, curated) are not shown; "-" is the only
    signal for a missing fact.
  - Filters, search and the recipe grid are not part of this feature (backlog #2); the detail must
    work from whichever list opens it.
