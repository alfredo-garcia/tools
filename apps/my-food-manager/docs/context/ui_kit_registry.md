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

### SearchInput
- **Props:** `value`, `onChange`, `placeholder`, `error?: string`. Pill input with search icon; focus ring; error state with message below.

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
- **Props:** `recipeId: string`, `className?: string`, `children`.
- **Guidance:** use it for every link to a recipe detail; do not use `next/link` for them. Modified clicks (Ctrl/Cmd/Shift/Alt, middle button) keep the browser default.

### DetailLayer
- **Category:** Feedback/Overlays. **Import:** `components/overlays/DetailLayer`. **Status:** Beta.
- **Description:** full-screen layer below 1024px, large modal (max 720px, 90% height, `radius.lg`, `elevation.3`, dimmed backdrop) from 1024px. Owns the top bar: mobile "Atrás" button, desktop "Cerrar" icon button; a compact title fades into the bar once the element marked `data-detail-title` scrolls under it. Traps focus, closes on Esc and backdrop click (desktop), locks page scroll, returns focus to the opener on close, respects `prefers-reduced-motion`.
- **Props:** `title?: string` (dialog name and compact title), `resetKey?: string` (scroll returns to the top when it changes), `onClose: () => void`, `children`.
- **Guidance:** one scrolling area; children render inside it. Distinct from `Sheet`, which is a bottom sheet on mobile.

### CollapsibleSection
- **Category:** Data Display. **Import:** `components/recipes/detail/CollapsibleSection`. **Status:** Beta.
- **Description:** titled card (`radius.md`, `elevation.1`) whose body folds with a height animation. Starts open, keeps its own state, chevron points down when open and right when closed.
- **Props:** `title: string`, `children`.
- **A11y:** the title is an `h2` containing a button with `aria-expanded` and `aria-controls`; the panel is a labelled `region`, `inert` while closed; button min height 56px.

### RecipeDetail
- **Category:** Data Display. **Import:** `components/recipes/detail/RecipeDetail` (sections in the same folder: `InfoSection`, `IngredientsSection`, `StepsSection`, `NotesSection`). **Status:** Beta.
- **Description:** the recipe detail screen content inside a `DetailLayer`: photo (16:9), title (`heading-1`), then the sections Info general, Ingredientes, Pasos and Notas, each a `CollapsibleSection`. Handles loading, no-library and not-found states with `EmptyState`.
- **Props:** `RecipeDetail`: `id: string` (recipe id from the address). Sections: `recipe: Recipe`, plus `library: Library` for `InfoSection` and `IngredientsSection`.
- **Rules:** missing values show "-"; the time row in `InfoSection` is a disclosure with the prep/cook/rest breakdown; ingredient lines show quantity, name, note, an "opcional" tag, and a `RecipeLink` when the line points to a recipe in the library; `NotesSection` renders nothing when there are no notes, variations or source.

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
None. The components introduced by feature `my-food-manager/002` (recipe detail) are registered above; the prototype names `TmpRecipeDetailLayer`, `TmpDetailBar`, `TmpCollapsibleSection`, `TmpStaticChip` and the info/ingredient/step lists in its UX Flow map to `DetailLayer`, `CollapsibleSection`, `TagChip` and the `RecipeDetail` sections.

## 5. Web / React Native Parity Notes
Not applicable (web only).

## 6. Versioning
- **Last updated:** 2026-10-29 (recipe detail components; `RecipePhoto` props corrected to the implementation)
- **Owner:** Al
- Initial registry, all entries Beta pending implementation.
