# UI Kit Registry: My Food Manager

> Project: `my-food-manager`
> Status: Approved (2026-10-28)
> Note: initial registry; no code exists yet. Components are specified from the approved style guide (`prototypes/style-guide.html`) and will be implemented in `src/components` (Tailwind CSS + lucide-react, per tech_standards §7). Entries get corrected against real source once built.

## 1. How to Read This Registry
- **Categories:** Layout, Navigation, Inputs, Data Display, Feedback/Overlays.
- **Platform:** all components are Web (responsive); the mobile/desktop difference is handled inside the component.
- **Status:** `Stable` (safe), `Beta`, `Deprecated`. All entries start as `Beta` until implemented and reviewed.
- Import path root: `src/components`.

## 2. Component Index
| Component | Category | Platform | Status | Import path |
|---|---|---|---|---|
| `AppShell` | Layout | Web | Beta | `components/layout/AppShell` |
| `AppFrame` | Layout | Web | Beta | `components/layout/AppFrame` |
| `BottomNav` / `SideNav` | Navigation | Web | Beta | `components/navigation/Nav` |
| `Button` | Inputs | Web | Beta | `components/inputs/Button` |
| `Chip` | Inputs | Web | Beta | `components/inputs/Chip` |
| `SearchInput` | Inputs | Web | Beta | `components/inputs/SearchInput` |
| `FilterChip` | Inputs | Web | Beta | `components/inputs/FilterChip` |
| `FilterOptions` | Inputs | Web | Beta | `components/inputs/FilterOptions` |
| `RecipeLibrary` | Data Display | Web | Beta | `components/recipes/RecipeLibrary` |
| `RecipeFilters` | Data Display | Web | Beta | `components/recipes/RecipeFilters` |
| `useListReorder` | Data Display (hook) | Web | Beta | `components/recipes/use-list-reorder` |
| `RecipeTile` | Data Display | Web | Beta | `components/recipes/RecipeTile` |
| `RecipePhoto` | Data Display | Web | Beta | `components/recipes/RecipePhoto` |
| `TagChip` | Data Display | Web | Beta | `components/recipes/TagChip` |
| `RecipeLink` | Navigation | Web | Beta | `components/recipes/RecipeLink` |
| `RecipeDetail` (+ `InfoSection`, `IngredientsSection`, `StepsSection`, `NotesSection`) | Data Display | Web | Beta | `components/recipes/detail/*` |
| `CollapsibleSection` | Data Display | Web | Beta | `components/recipes/detail/CollapsibleSection` |
| `DetailLayer` | Feedback/Overlays | Web | Beta | `components/overlays/DetailLayer` |
| `RatingStars` | Inputs | Web | Beta | `components/recipes/RatingStars` |
| `FavoriteButton` | Inputs | Web | Beta | `components/recipes/FavoriteButton` |
| `ChecklistItem` | Data Display | Web | Beta | `components/lists/ChecklistItem` |
| `AisleHeader` | Data Display | Web | Beta | `components/lists/AisleHeader` |
| `Sheet` | Feedback/Overlays | Web | Beta | `components/overlays/Sheet` |
| `Toast` | Feedback/Overlays | Web | Beta | `components/feedback/Toast` |
| `SyncBadge` | Feedback/Overlays | Web | Beta | `components/feedback/SyncBadge` |
| `EmptyState` | Feedback/Overlays | Web | Beta | `components/feedback/EmptyState` |
| `TmpComingSoon` | Feedback/Overlays | Web | Beta (temporary) | `components/feedback/TmpComingSoon` |
| `TmpResultGroup` | Data Display | Web | Beta (temporary) | `components/recipes/TmpResultGroup` |
| `TmpSwitch` | Inputs | Web | Beta (temporary) | `components/inputs/TmpSwitch` |
| `TmpSegmentedControl` | Inputs | Web | Beta (temporary) | `components/inputs/TmpSegmentedControl` |
| `TmpPendingChanges` | Feedback/Overlays | Web | Beta (temporary) | `components/feedback/TmpPendingChanges` |
| `PersonPicker` | Inputs | Web | Beta | `components/inputs/PersonPicker` |
| `PlanScreen` | Data Display (assembly) | Web | Beta | `components/plan/PlanScreen` |
| `PlanDayList` / `PlanDay` | Data Display | Web | Beta | `components/plan/PlanDayList`, `components/plan/PlanDay` |
| `PlanWeek` / `PlanColumn` / `WeekNav` | Data Display | Web | Beta | `components/plan/PlanWeek`, `components/plan/PlanColumn`, `components/plan/WeekNav` |
| `PlanSlot` / `PlanRecipeItem` | Data Display | Web | Beta | `components/plan/PlanSlot`, `components/plan/PlanRecipeItem` |
| `RecipePickerSheet` | Feedback/Overlays | Web | Beta | `components/plan/RecipePickerSheet` |
| `MissingIngredientsSheet` | Feedback/Overlays | Web | Beta | `components/plan/MissingIngredientsSheet` |

## 3. Component Entries

### AppShell
- **Category:** Layout. **Import:** `components/layout/AppShell`. **Status:** Beta.
- **Description:** page frame of the recipe list: title, `SyncBadge`, refresh button, pull-to-refresh and content. It does not contain the navigation (that is `AppFrame`).
- **Props:** `title: string`, `wide?: boolean` (content up to 1180 px instead of 768 px; the weekly Plan), `children`.
- **Notes:** used by the recipe list, Despensa and Plan; other sections render their own content inside `AppFrame`.

### AppFrame
- **Category:** Layout. **Import:** `components/layout/AppFrame`. **Status:** Beta (feature `my-food-manager/006`).
- **Description:** client frame in the root layout that holds the main navigation around every screen: `BottomNav` below 640px (not rendered while a recipe detail is open) and `SideNav` from 640px, plus the content region. Keeps the sidebar choice on the device (key `sidebar-expanded`).
- **Props:** `children`.
- **Rules:** destinations come from `lib/domain/navigation.ts` (`DESTINATIONS`, `currentDestination`, `sidebarExpanded`, `showBottomNav`); pages never render their own navigation.

### BottomNav / SideNav (`Nav`)
- **Category:** Navigation. **Import:** `components/navigation/Nav`. **Status:** Beta.
- **Description:** the four destinations (Recetas, Plan, Despensa, Perfil) with lucide icons (`ChefHat`, `CalendarDays`, `Refrigerator`, `User`). `BottomNav` (below 640px): fixed bar, icon above label, min height 64px, bottom safe-area inset respected; the current item has `aria-current="page"`, `color.primary.500`, a heavier icon and a 3px top bar. `SideNav` (from 640px): sticky, full height, 72px collapsed (icons only, labels visually hidden but kept for assistive technology) or 224px expanded; a brand row with the PWA icon and "My Food", and a collapse/expand button at the bottom (`aria-expanded`, label "Contraer menú" / "Expandir menú").
- **Props:** both: `items: Destination[]` (`id`, `href`, `label`), `currentId: DestinationId | null`; `SideNav` also `expanded: boolean`, `onToggle()`.
- **A11y:** `<nav aria-label="Principal">`, items are links, min 44px, label always visible in `BottomNav`.

### Button
- **Category:** Inputs. **Import:** `components/inputs/Button`. **Status:** Beta.
- **Props:** `variant: "primary" | "secondary" | "ghost" | "danger"` (default `primary`), `loading?: boolean`, `disabled?: boolean`, `icon?: LucideIcon`.
- **States:** default, pressed (scale .97), focus ring, disabled (40% opacity), loading (spinner).
- **Guidance:** one primary per section; pill shape, min height 48px.

### Chip
- **Category:** Inputs. **Import:** `components/inputs/Chip`. **Status:** Beta.
- **Props:** `pressed: boolean`, `tone?: "default" | "lime"`, `icon?: ReactNode`, `onToggle`.
- **Guidance:** quick filters in a horizontally scrolling row; `aria-pressed`; min height 44px.

### FilterChip
- **Category:** Inputs. **Import:** `components/inputs/FilterChip`. **Status:** Beta (feature `my-food-manager/003`).
- **Description:** dropdown-style filter trigger. Idle shows only the filter name with a chevron; active shows the chosen value in a soft-tinted chip (`primary-500` at 15% fill + border) with an "x" that clears it. Differs from `Chip` (a plain on/off toggle).
- **Props:** `label: string`, `value?: string` (set = active), `open: boolean`, `disabled?: boolean`, `onToggle`, `onClear`.
- **A11y:** `aria-expanded`, `aria-haspopup="listbox"`; the "x" is its own 44px button labelled "Quitar filtro <label>".

### FilterOptions
- **Category:** Inputs. **Import:** `components/inputs/FilterOptions`. **Status:** Beta.
- **Description:** listbox of pills for one filter, each with its recipe count; selected shows a check, options with count 0 are disabled.
- **Props:** `label`, `options: {value, label, count}[]`, `selected?: string`, `onSelect(value)`. Empty list shows "Sin opciones".

### RecipeFilters
- **Category:** Data Display (assembly). **Import:** `components/recipes/RecipeFilters`. **Status:** Beta.
- **Description:** the six recipe filters (Categoría, Tiempo, Dieta, Cocina, Dificultad, Proteína) in a horizontal scrolling row, the options panel of the open one below it, and the "N de M recetas" count with "Limpiar".
- **Props:** `library: Pick<Library, "recipes" | "vocab">`, `state: FilterState`, `onChange(state)`, `shown: number`. Logic lives in `lib/domain/filters.ts`.

### useListReorder
- **Category:** hook. **Import:** `components/recipes/use-list-reorder`. **Status:** Beta.
- **Description:** FLIP animation for a vertical list. Children carry `data-flip-key`; survivors slide to their new position, new ones fade in. Disabled under `prefers-reduced-motion`.
- **Usage:** `const ref = useListReorder<HTMLUListElement>(ids.join("|"))` on a `relative` container.

### SearchInput
- **Category:** Inputs. **Import:** `components/inputs/SearchInput`. **Status:** Beta.
- **Description:** pill search field (`type="search"`, 48px high) with a leading search icon, inside a `role="search"` container. A clear "x" button (44px target, `aria-label` "Borrar búsqueda") shows only while there is text. Enter calls `onSubmit`; Esc with text clears. Clearing returns focus to the input.
- **Props (as implemented):** `value`, `onChange(value)`, `onClear()`, `onSubmit()`, `placeholder`, `label` (accessible name). The 1-second wait and the 3-character minimum live in `components/recipes/use-search-query` and `lib/domain/search.ts`, not here.

### TmpResultGroup
- **Category:** Data Display. **Import:** `components/recipes/TmpResultGroup`. **Status:** Beta, temporary.
- **Description:** group of search results: an `<h2>` reading "<label> · <count>" (small uppercase label, count in `color.text`) and the rows under it.
- **Props:** `label: string`, `count: number`, `children`.
- **Guidance:** formalize or replace when the grouped-list pattern is reused (for example in the shopping list).

### RecipeTile
- **Category:** Data Display. **Import:** `components/recipes/RecipeTile`. **Status:** Beta.
- **Description:** 4:3 photo area (`RecipePhoto`), favorite toggle top-right, category tag bottom-left, title, time (clock) and difficulty (flame).
- **Props:** `recipe: RecipeSummary`, `isFavorite: boolean`, `onOpen`, `onToggleFavorite`.
- **Guidance:** used in all recipe grids; whole tile is the tap target, favorite stops propagation.

### RecipePhoto
- **Props (as implemented):** `recipeId: string`, `photoVersion?: string`, `category?: string`, `className?: string` (the caller sets size and aspect, e.g. `aspect-video`).
- **Behavior:** shows the Drive photo (via `/api/photo/<recipeId>?v=<photoVersion>`); with no photo, or if it fails to load, shows the category gradient (`cat.<id>`) plus emoji.

### TagChip
- **Category:** Data Display. **Import:** `components/recipes/TagChip`. **Status:** Beta.
- **Description:** non-interactive pill for tags and the category. The kit's `Chip` is a pressed/unpressed filter toggle; this one only displays.
- **Props:** `children`, `tint?: string` (CSS color, e.g. `var(--color-cat-desserts)`; with a tint the chip has no border and dark text, otherwise `color.surface.2` with `color.border`).
- **Guidance:** min height 32px; never a tap target.

### RecipeLink
- **Category:** Navigation. **Import:** `components/recipes/RecipeLink`. **Status:** Beta.
- **Description:** link to a recipe detail (`/recipes/<id>`). Keeps a real `href` (new tab, copy link) but a plain click opens the detail in place with the History API, so no request is made and it works offline.
- **Props:** `recipeId: string`, `className?: string`, `current?: boolean` (marks the recipe open in the side panel: `aria-current="true"`), `replace?: boolean` (replaces the history entry instead of adding one, used when switching recipes in the side panel), `children`.
- **Guidance:** use it for every link to a recipe detail; do not use `next/link` for them. Modified clicks (Ctrl/Cmd/Shift/Alt, middle button) keep the browser default.

### DetailLayer
- **Category:** Feedback/Overlays. **Import:** `components/overlays/DetailLayer`. **Status:** Beta.
- **Description:** hosts the recipe detail in one of three modes, switching between them without rebuilding its content. `fullscreen` (small windows): full screen, "Atrás" button, the compact title fades into the bar once the element marked `data-detail-title` scrolls under it. `modal` (medium): centered, max 720px, 90% height, `radius.lg`, `elevation.3`, dimmed backdrop, "Cerrar" at the right of the bar, the title always in the bar. `panel` (large): fills the right region beside the list, no backdrop, radius or shadow, "Cerrar" and the title always in the bar, not a dialog (`role="region"`). Fullscreen and modal trap focus, lock page scroll and return focus to the opener; the modal also closes on Esc and backdrop click. The panel does none of these.
- **Props:** `mode: "fullscreen" | "modal" | "panel"`, `title?: string` (accessible name and bar title), `resetKey?: string` (scroll returns to the top when it changes), `onClose: () => void`, `children`.
- **Guidance:** one scrolling area; children render inside it. Descendants can style by mode with `group-data-[detail-mode=panel]:` and `group-data-[detail-mode=modal]:`. Distinct from `Sheet`, which is a bottom sheet on small windows.

### RecipeLibrary
- **Category:** Data Display (assembly). **Import:** `components/recipes/RecipeLibrary`. **Status:** Beta.
- **Description:** the recipe list with filters and the recipe detail, laid out by window width. Small and medium: the list as a page and the detail over it. Large (>=1280px): a 400px list column with its own scroll (title, sync badge, filters and rows scroll together) and the detail in a panel on the right; the selected row is highlighted and, with nothing selected, the panel shows "Elige una receta".
- **Props:** none (reads the library and the address).
- **Rules:** choosing a recipe in the large layout adds a history entry when the panel is empty and replaces it otherwise; the list offset is carried over when the layout changes.

### CollapsibleSection
- **Category:** Data Display. **Import:** `components/recipes/detail/CollapsibleSection`. **Status:** Beta.
- **Description:** titled card (`radius.md`, `elevation.1`) whose body folds with a height animation. Starts open, keeps its own state, chevron points down when open and right when closed.
- **Props:** `title: string`, `children`.
- **A11y:** the title is an `h2` containing a button with `aria-expanded` and `aria-controls`; the panel is a labelled `region`, `inert` while closed; button min height 56px.

### RecipeDetail
- **Category:** Data Display. **Import:** `components/recipes/detail/RecipeDetail` (sections in the same folder: `InfoSection`, `IngredientsSection`, `StepsSection`, `NotesSection`). **Status:** Beta.
- **Description:** the recipe detail screen content inside a `DetailLayer`: photo (16:9; in the `panel` mode it sits beside Info general, two fifths and three fifths), title (`heading-1`, shown in fullscreen only), then the sections Info general, Ingredientes, Pasos and Notas, each a `CollapsibleSection`. Handles loading, no-library and not-found states with `EmptyState`.
- **Props:** `RecipeDetail`: `id: string` (recipe id from the address), `onClose?: () => void` (when the detail is not driven by the address, e.g. over the Plan) and `overlay?: boolean` (never the side panel: large windows show a modal). Sections: `recipe: Recipe`, plus `library: Library` for `InfoSection` and `IngredientsSection`.
- **Rules:** missing values show "-"; the time row in `InfoSection` is a disclosure with the prep/cook/rest breakdown; ingredient lines show quantity, name, note, an "opcional" tag, and a `RecipeLink` when the line points to a recipe in the library; `NotesSection` renders nothing when there are no notes, variations or source.

### PlanScreen (and its parts)
- **Category:** Data Display (assembly). **Import:** `components/plan/*`. **Status:** Beta (feature `my-food-manager/008`).
- **Description:** the Plan section. `PlanScreen` holds the state (days loaded, week, picker, missing ingredients, key dialog) and composes: `PlanDayList` of `PlanDay` (small windows, 8 days then +7 at the end), `PlanWeek` of `PlanColumn` plus `WeekNav` (from 640px, Monday–Sunday, 132px minimum column, previous week disabled at the current one), each day with three `PlanSlot` (Desayuno, Almuerzo, Cena) listing `PlanRecipeItem` (photo or emoji, title, X to remove; text dishes read only). Days before today are dimmed and read only.
- **Props:** `PlanSlot`: `date`, `meal`, `label`, `dishes`, `past`, `columns`, `actions: PlanActions` (`recipes`, `onAdd`, `onRemove`, `onOpen`). `PlanWeek`: `today`, `offset`, `view`, `actions`, `onOffset`. `PlanDayList`: `today`, `count`, `view`, `actions`, `onMore`. `WeekNav`: `canGoBack`, `onPrevious`, `onNext`.
- **Guidance:** domain logic is in `lib/domain/plan-view` and `plan-calendar`; the screen never writes by itself, it enqueues operations in the outbox.

### RecipePickerSheet / MissingIngredientsSheet
- **Category:** Feedback/Overlays. **Import:** `components/plan/RecipePickerSheet`, `components/plan/MissingIngredientsSheet`. **Status:** Beta.
- **Props:** `RecipePickerSheet`: `date`, `meal`, `recipes: Recipe[]`, `onClose`, `onConfirm(recipeId)`; search (3 letters, 1 s) over titles, single selection, "Añadir receta" enabled with a selection. `MissingIngredientsSheet`: `recipeTitle`, `ingredients: string[]` (names), `onContinue`, `onAddToList`; closing by Esc or backdrop equals `onContinue`.
- **Notes:** both are `Sheet` with their own content; the picker is `size="tall"`, the missing sheet uses `hideClose`.

### RatingStars / FavoriteButton
- **RatingStars props:** `value: 0-5`, `onChange(n)`, `size?`; each star is a button with `aria-pressed` and label "N estrellas".
- **FavoriteButton props:** `pressed`, `onToggle`; heart fills when pressed; 40-44px hit area.

### ChecklistItem / AisleHeader
- **ChecklistItem props:** `label: string`, `source?: string` (recipe name), `done: boolean`, `onToggle`. Row min height 56px; done = filled success checkbox + strike-through.
- **AisleHeader props:** `label: string` (ingredient family label). Caption style, uppercase.

### Sheet
- **Props:** `open`, `onClose`, `title`, `subtitle?`, `size?: "auto" | "tall"`, `hideClose?: boolean`, `children`. Bottom sheet below 640px (top radius `radius.lg`), centered modal (max width 520px) from 640px, including large windows. `subtitle` is a `caption` line under the title; `size="tall"` fills 88% of the window height on small and min(640px, 100%) on larger ones (recipe picker). Traps focus, locks page scroll, closes on Escape/backdrop, returns focus to the opener. `hideClose` removes the close button when the content has its own way out. Implemented in feature `my-food-manager/008`.

### Toast / SyncBadge / EmptyState
- **Toast:** `message`; announced politely (`role="status"`). The screen that shows it dismisses it after 4 s.
- **SyncBadge props:** `status: "idle" | "syncing" | "offline" | "error"`, `syncedAt?: string` (shows "Sincronizado · hace X"). Offline and error use `color.warning.500`, idle uses lime.
- **EmptyState props:** `emoji`, `title`, `hint?`, `action?: ReactNode` (usually a `Button`).

### TmpComingSoon
- **Category:** Feedback/Overlays. **Import:** `components/feedback/TmpComingSoon`. **Status:** Beta, temporary until each section has its own content.
- **Description:** centered placeholder for a section without content: a 72px circle with the section icon, the title (`heading-1`) and "Próximamente" in `color.text.muted`. No actions.
- **Props:** `icon: LucideIcon`, `title: string`.

### TmpSwitch
- **Category:** Inputs. **Import:** `components/inputs/TmpSwitch`. **Status:** Beta, temporary (feature `my-food-manager/007`).
- **Description:** labeled on/off switch. The state shows in the knob position, a check mark and the label weight, not only in color.
- **Props:** `label`, `checked`, `tone: "success" | "primary"`, `disabled?`, `ariaLabel`, `onChange()`.
- **Guidance:** formalize as `Switch` when a second feature reuses it.

### TmpSegmentedControl
- **Category:** Inputs. **Import:** `components/inputs/TmpSegmentedControl`. **Status:** Beta, temporary (feature `my-food-manager/007`).
- **Description:** exclusive choice among a few options, rendered as a tab list or as a radio group.
- **Props:** `kind: "tabs" | "radio"`, `ariaLabel`, `items: {value, label}[]`, `value`, `onChange(value)`.
- **Guidance:** formalize as `SegmentedControl` when reused.

### TmpPendingChanges
- **Category:** Feedback/Overlays. **Import:** `components/feedback/TmpPendingChanges`. **Status:** Beta, temporary (feature `my-food-manager/007`).
- **Description:** "N cambios pendientes" bar; offers "Introducir clave" when the device has no write key.
- **Props:** `count`, `keyNeeded`, `onEnterKey()`.
- **Guidance:** formalize alongside `SyncBadge` when other features write to Drive.

### PersonPicker
- **Props:** `people: {id, name}[]`, `current`, `onChange`. Round avatar button in the header opening a `Sheet` with the household members; stores choice in the device.

## 4. Temporary / Not-Yet-Formalized Components
`TmpComingSoon` (feature `my-food-manager/006`) is registered above and is removed when Plan, Despensa and Perfil have their own content. `TmpResultGroup` (feature `my-food-manager/005`) is registered above and stays temporary until the grouped-list pattern is reused. The components introduced by feature `my-food-manager/002` (recipe detail) are registered above; the prototype names `TmpRecipeDetailLayer`, `TmpDetailBar`, `TmpCollapsibleSection`, `TmpStaticChip` and the info/ingredient/step lists in its UX Flow map to `DetailLayer`, `CollapsibleSection`, `TagChip` and the `RecipeDetail` sections.

Feature `my-food-manager/007` (pantry) added `TmpSwitch`, `TmpSegmentedControl` and `TmpPendingChanges`, registered above. Its write-key dialog, `KeyDialog` (`components/pantry/KeyDialog`), is an own overlay because `Sheet` is registered but not implemented yet; it should become a `Sheet` when `Sheet` is built.

## 5. Web / React Native Parity Notes
Not applicable (web only).

## 6. Versioning
- **Last updated:** 2026-10-30 (pantry switches of feature `my-food-manager/007`: `TmpSwitch`, `TmpSegmentedControl`, `TmpPendingChanges`; earlier: 2026-10-29 (recipe search of feature `my-food-manager/005`: `SearchInput` as implemented, `TmpResultGroup`; earlier: main navigation of feature `my-food-manager/006`: `AppFrame`, `BottomNav` / `SideNav` rewritten, `TmpComingSoon`, `AppShell` corrected; earlier: responsive layout: DetailLayer modes, RecipeLibrary, RecipeLink props; added FilterChip, FilterOptions, RecipeFilters, useListReorder; recipe detail components; `RecipePhoto` props corrected to the implementation))
- **Owner:** Al
- Initial registry, all entries Beta pending implementation.
