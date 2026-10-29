# Recipe Search

> Project: `my-food-manager`
> MVP: yes (Product Vision §5/§7) — Backlog item: #2 (Recipe browse, filters & search), the "simple search" part left out of 003

* **Feature Name:** Recipe Search.

* **Goal:** Let Al or his partner find a recipe by typing a few letters of something they remember about it (its name, the protein, an ingredient), instead of scanning the list or guessing which filter holds it. Success: a known recipe is on screen after typing three letters and waiting a second, with no tap on any filter, and the results say where the text was found.

* **The Delta:** Today the list can only be narrowed with the six filters, and each one needs you to know which option the recipe sits under. There is no way to look for a recipe by name or by an ingredient. As the library grows past 100 recipes, scrolling and filter-guessing stops being quick.

* **User Persona:** Al (primary) and the household partner, deciding what to cook, on a phone or desktop, online or offline.

* **Core Mechanics (High Level):**
  - A search bar sits under the "Recetas" title and above the filters, with a "x" at its right end that appears when there is text and clears it in one tap.
  - The search only runs once the text has at least 3 letters, and it runs by itself after the user has stopped typing for 1 second. With fewer than 3 letters nothing is filtered and the list shows as if there were no search, with no message.
  - A recipe matches in one of three places: its name, its protein, or the names of its ingredients. Case and accents are ignored, and a word matches part of a value ("pol" finds "pollo"). With several words, all of them must be found in that same place.
  - With an active search the results are shown in groups, in this order: "Recetas" (name matches), "Proteína" (protein matches), "Ingredientes" (ingredient matches). Only groups with results are shown. Inside each group recipes keep the alphabetical order of the list.
  - A recipe appears in every group where it matches, so it can be listed more than once.
  - The search and the filters are independent: neither one clears or changes the other. A recipe is shown only if it matches the search text and every active filter, and the "N de M recetas" count and the "no results" state reflect both. "Limpiar" and "Quitar filtros" only affect filters; only the "x" in the search bar clears the text.
  - Searching works entirely on the device over the stored library, online or offline.

* **Constraints / Out of Scope:**
  - Category, cuisine, diet, difficulty and time are not searched; they stay available only as filters.
  - No search over steps, notes, comments, reviews or descriptions, and no search history or suggestions.
  - No sorting by relevance and no highlighting of the matched text.
  - No typo tolerance or synonyms; partial words and missing accents are the only flexibility.
  - The search text is not saved: it is empty when the app is reopened or reloaded. No search term in the address.
  - No server-side search and no new endpoints. No change to the filters themselves.
