# Shopping List Section

> Project: `my-food-manager`
> MVP: no (stage 2). Backlog item: none of its own; adjusts #7 Pantry, #8 Shopping list, #4 Main navigation, #3 Recipe detail and #2 Recipe browse (extends my-food-manager/006, 007, 010 and 012)

* **Feature Name:** Shopping list as its own section, with sharing, plus three adjustments to Despensa, the recipe detail and the recipe list.

* **Goal:** Al reaches the shopping list in one tap and sends it to anyone as text grouped by family.
  Despensa, the recipe detail and the recipe list read more cleanly on a phone.

* **The Delta:** The shopping list is now a tab inside Despensa and can't be shared. Despensa's filter
  opens on "Tengo" and lists "Todos" last. On a phone, the recipe detail opens with Info general and
  Notas expanded, which pushes Ingredientes down. In the recipe list, the rating sits slightly above
  the category text.

* **User Persona:** Al, the planner and cook (primary). The household partner uses the same screens
  and gets the shared list.

* **Core Mechanics (High Level):**
  - The main navigation has five sections: Recetas · Plan · Compra · Despensa · Perfil. Compra opens
    the shopping list at its own address, titled "Lista de compra", with an icon badge that counts the
    ingredients to buy. It works as the old tab did: search, family filter, and a row stays struck
    through after its "Comprar" is turned off.
  - Despensa no longer has tabs. Its filter reads "Todos · Tengo · No tengo" and opens on "Todos".
  - "Compartir" in Compra opens the device's share menu with text only. The text has the title
    "Lista de la compra", then each family in vocabulary order with its ingredients marked "☐", and
    ingredients with no family go under "Otros" at the end. It always shares the whole list, whatever
    the search or filters, and leaves out the rows struck through in this visit. If the browser has no
    share menu, the text is copied and the app says "Lista copiada". The button is hidden when the
    list is empty.
  - In the recipe detail, on small windows (under 640 px), Info general and Notas always open
    collapsed. On medium and large windows every section opens expanded, as today.
  - In the recipe list rows, the rating sits on the same line as the category.

* **Constraints / Out of Scope:**
  - No quantities, photos or links in the shared text, and nothing written to Drive.
  - No change to what the switches do or to how the list is calculated. It is still the ingredients
    with "Comprar" on.
  - The collapsed state is not remembered between recipes or sessions.
  - Ingredientes and Pasos keep opening expanded on every window size.
  - No new sections beyond Compra, and no change to Plan or Perfil.
