# UX Flow: Recipe Filters

> Project: `my-food-manager`
> PRD: `003_recipe-filters_prd.md`
> Status: Approved (2026-10-29)
> Prototype: the implemented screen itself (`/`), built directly on the kit; no separate mock-up was made.

## 1. Screen: SCR-library-list (modified)
```
Recetas                         [sync]
─────────────────────────────────────
[Categoría ▾] [Tiempo ▾] [Dieta ▾] …   ← one scrolling row (RecipeFilters)
┌ options panel (FilterOptions) ────┐  ← opens under the row
│ ( Desayunos 3 ) ( Principales 9 ) │
└───────────────────────────────────┘
12 de 33 recetas              Limpiar  ← only with active filters
[row][row][row] …                      ← animated reorder
```

## 2. Components
| Component | Status | Role |
|---|---|---|
| `RecipeFilters` (`components/recipes/RecipeFilters`) | new | Owns the open filter; renders the row, the options panel, count and "Limpiar" |
| `FilterChip` (`components/inputs/FilterChip`) | new | Idle: name + chevron. Active: soft-tinted fill + colored border, value label + "x" |
| `FilterOptions` (`components/inputs/FilterOptions`) | new | Listbox of pills with counts; disabled when count is 0 |
| `useListReorder` (`components/recipes/use-list-reorder`) | new | FLIP animation: moves stay, fades new |
| `Button` (ghost) | reused | "Limpiar", "Quitar filtros" |
| `EmptyState` | reused | "Ninguna receta coincide" |
| `RecipePhoto` | reused | unchanged rows |

## 3. Flow
1. Tap **Dieta** → panel opens under the row, chip shows `aria-expanded`, chevron rotates.
2. Tap **Sin gluten** → panel closes, chip becomes `Sin gluten ✕` (tinted), list reorders.
3. Tap **✕** → chip returns to **Dieta**; list reorders back.
4. Tap another chip while one is open → panel switches to the new filter.
5. Esc / tap outside → panel closes without changes.

## 4. States
- Idle chip, open chip, active chip, active+open chip, disabled chip (no options), disabled option (count 0), selected option (check mark).
- List: normal, filtered, no results.

## 5. Motion
`duration.base` 220 ms ease-out for FLIP moves and fade-in; panel opens with a 150 ms fade/slide. All disabled with `prefers-reduced-motion`.
