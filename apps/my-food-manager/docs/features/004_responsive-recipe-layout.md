# Responsive Recipe Layout

> Project: `my-food-manager`
> MVP: yes (Product Vision §5/§7) — Backlog item: #3, extends Recipe Detail (`my-food-manager/002`) to large screens

* **Feature Name:** Responsive Recipe Layout.

* **Goal:** Let Al or his partner browse the list and read a recipe at the same time on a large screen, so that changing recipes takes one click and no screen is lost. Success: on a desktop window, the list stays visible while any recipe's full detail is open beside it, and on phones and tablets nothing changes except where noted.

* **The Delta:** Today every screen wider than 1024 px opens the detail as a modal over the list: the list is dimmed and unusable while reading, so comparing two recipes means close, pick, open. The 1024 px breakpoint also makes tablets and small laptops behave the same as a 27" monitor.

* **User Persona:** Al (primary) and the household partner, on a laptop or desktop monitor planning what to cook.

* **Core Mechanics (High Level):**
  - The layout depends on the window width: small (under 640 px), medium (640 to 1279 px) and large (1280 px and above).
  - Small: unchanged from today; the detail opens full screen with an "Atrás" button.
  - Medium: the detail opens as a modal over the list, as it does on desktop today, with the recipe title always visible in its header and a "Cerrar" button.
  - Large: the list is a fixed-width column on the left, with its own scroll and the filters inside it (the filters wrap onto several lines instead of scrolling sideways); the detail opens in a panel on the right that uses all the width available, with the photo beside the general info (two fifths and three fifths) instead of above it, with no modal and no dimmed backdrop, and the list stays usable.
  - In the large layout the selected recipe is highlighted in the list; choosing another recipe replaces the one in the panel, and the panel's close button empties it. With nothing selected, the panel shows "Elige una receta".
  - Each recipe keeps its own address, and resizing the window across a breakpoint keeps the open recipe and its scroll position.

* **Constraints / Out of Scope:**
  - No change to the content of the detail (sections, ingredients, steps, notes) or to the list's rows and filters, other than the filters wrapping in the column. The photo stays 16:9 in every layout.
  - No recipe grid and no navigation sidebar; they are separate features. In the large layout the list stays a column.
  - No resizable or collapsible columns, and no remembered widths.
  - No keyboard shortcuts to move between recipes (no previous/next).
  - No changes to the data, the sync or the offline behavior.
