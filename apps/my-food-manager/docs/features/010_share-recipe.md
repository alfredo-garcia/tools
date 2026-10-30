# Share Recipe

> Project: `my-food-manager`
> MVP: no (stage 2). Not in the Product Vision backlog (§7); treated as a new feature without changing the vision, as decided by the user on 2026-10-30.

* **Feature Name:** Share button in the recipe detail that opens the device's share menu with the recipe's photo, title and a link to its detail.

* **Goal:** Let Al send a recipe to someone (a chat, a message, a note) in one tap from the detail, with the photo and a link that opens the recipe. Success: from the detail of any recipe, on a phone, one tap opens the system share menu with the photo, the title and the link, and sharing to a chat shows all three.

* **The Delta:** Today a recipe can only be read; to send it Al has to take a screenshot or copy the address by hand.

* **User Persona:** Al (planner-cook), mostly on the phone; also on a larger screen at home.

* **Core Mechanics (High Level):**
  - The recipe detail gets a "Compartir" button next to the favorite button. On small windows it is an icon beside the heart on the title row; on medium and large windows it is a button with the text "Compartir" beside "Añadir a favoritos" under the photo. It appears wherever the detail appears: from Recetas, from the Perfil favorites and over the Plan. It is not in the recipe list.
  - Tapping it opens the system share menu with the recipe's title, its photo (when it has one and the device can share images) and the link to the recipe's detail.
  - Where the browser has no share menu, the button copies the link and says "Enlace copiado".
  - Cancelling the menu does nothing; a failure says "No se pudo compartir".

* **Constraints / Out of Scope:**
  - Nothing is written to Drive and no data changes: it is a read-only action.
  - Only a single recipe from its detail: no sharing from the list, the plan, the pantry or the shopping list, and no sharing of several recipes or of the recipe's content (ingredients, steps).
  - The link opens the app on the recipe, so whoever receives it needs the app's address to be reachable; no private or expiring links.
  - No custom share targets, no share counts, no history.
