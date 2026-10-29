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
| `BottomNav` / `SideNav` | Navigation | Web | Beta | `components/navigation/Nav` |
| `Button` | Inputs | Web | Beta | `components/inputs/Button` |
| `Chip` | Inputs | Web | Beta | `components/inputs/Chip` |
| `SearchInput` | Inputs | Web | Beta | `components/inputs/SearchInput` |
| `FilterChip` | Inputs | Web | Beta | `components/inputs/FilterChip` |
| `FilterOptions` | Inputs | Web | Beta | `components/inputs/FilterOptions` |
| `RecipeFilters` | Data Display | Web | Beta | `components/recipes/RecipeFilters` |
| `useListReorder` | Data Display (hook) | Web | Beta | `components/recipes/use-list-reorder` |
| `RecipeTile` | Data Display | Web | Beta | `components/recipes/RecipeTile` |
| `RecipePhoto` | Data Display | Web | Beta | `components/recipes/RecipePhoto` |
| `RatingStars` | Inputs | Web | Beta | `components/recipes/RatingStars` |
| `FavoriteButton` | Inputs | Web | Beta | `components/recipes/FavoriteButton` |
| `ChecklistItem` | Data Display | Web | Beta | `components/lists/ChecklistItem` |
| `AisleHeader` | Data Display | Web | Beta | `components/lists/AisleHeader` |
| `Sheet` | Feedback/Overlays | Web | Beta | `components/overlays/Sheet` |
| `Toast` | Feedback/Overlays | Web | Beta | `components/overlays/Toast` |
| `SyncBadge` | Feedback/Overlays | Web | Beta | `components/feedback/SyncBadge` |
| `EmptyState` | Feedback/Overlays | Web | Beta | `components/feedback/EmptyState` |
| `PersonPicker` | Inputs | Web | Beta | `components/inputs/PersonPicker` |

## 3. Component Entries

### AppShell
- **Category:** Layout. **Import:** `components/layout/AppShell`. **Status:** Beta.
- **Description:** page frame with header slot, scrolling content and the navigation (bottom bar on mobile, sidebar on desktop). Shows `SyncBadge` when offline.
- **Props:** `title: string`, `action?: ReactNode`, `children`.
- **Notes:** one per page; pages never render their own nav.

### BottomNav / SideNav (`Nav`)
- **Category:** Navigation. **Import:** `components/navigation/Nav`. **Status:** Beta.
- **Description:** the four destinations (Inicio, Recetas, Lista, Despensa) with lucide icons; current item uses `aria-current="page"` and `color.primary.500`.
- **Props:** `items: {href, label, icon}[]`, `current: string`.
- **A11y:** items are links, min 44px, label always visible.

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
- **Props:** `value`, `onChange`, `placeholder`, `error?: string`. Pill input with search icon; focus ring; error state with message below.

### RecipeTile
- **Category:** Data Display. **Import:** `components/recipes/RecipeTile`. **Status:** Beta.
- **Description:** 4:3 photo area (`RecipePhoto`), favorite toggle top-right, category tag bottom-left, title, time (clock) and difficulty (flame).
- **Props:** `recipe: RecipeSummary`, `isFavorite: boolean`, `onOpen`, `onToggleFavorite`.
- **Guidance:** used in all recipe grids; whole tile is the tap target, favorite stops propagation.

### RecipePhoto
- **Props:** `photoUrl?: string`, `category: CategoryId`, `emoji?: string`, `aspect?: "4/3" | "16/9"`.
- **Behavior:** shows the Drive photo (via `/api/photo`); with no photo shows the category gradient (`cat.<id>`) plus emoji.

### RatingStars / FavoriteButton
- **RatingStars props:** `value: 0-5`, `onChange(n)`, `size?`; each star is a button with `aria-pressed` and label "N estrellas".
- **FavoriteButton props:** `pressed`, `onToggle`; heart fills when pressed; 40-44px hit area.

### ChecklistItem / AisleHeader
- **ChecklistItem props:** `label: string`, `source?: string` (recipe name), `done: boolean`, `onToggle`. Row min height 56px; done = filled success checkbox + strike-through.
- **AisleHeader props:** `label: string` (ingredient family label). Caption style, uppercase.

### Sheet
- **Props:** `open`, `onClose`, `title`, `children`. Bottom sheet on mobile (top radius `radius.lg`), centered modal on desktop. Traps focus, closes on Escape/backdrop.

### Toast / SyncBadge / EmptyState
- **Toast:** `message`, `tone?: "success" | "error"`; auto-dismiss, announced politely.
- **SyncBadge props:** `status: "offline" | "pending" | "synced"`, `pendingCount?: number`. Offline/pending use `color.warning.500`, synced uses lime.
- **EmptyState props:** `emoji`, `title`, `hint?`, `action?: {label, onClick}`.

### PersonPicker
- **Props:** `people: {id, name}[]`, `current`, `onChange`. Round avatar button in the header opening a `Sheet` with the household members; stores choice in the device.

## 4. Temporary / Not-Yet-Formalized Components
None yet.

## 5. Web / React Native Parity Notes
Not applicable (web only).

## 6. Versioning
- **Last updated:** 2026-10-29 (added FilterChip, FilterOptions, RecipeFilters, useListReorder)
- **Owner:** Al
- Initial registry, all entries Beta pending implementation.
