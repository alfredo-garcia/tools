# UX Flow: Share Recipe

> Project: `my-food-manager`
> Source PRD: `010_share-recipe_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/010_share-recipe/index.html` (clickable; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; toolbar to simulate a browser with or without a share menu)
> Status: Approved by user on 2026-10-30

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Visual values come from `ui_standards.md` tokens and are not repeated here. The recipe detail stays as specified in the `002`, `004` and `009` UX Flows, with the changes below. Copy is Spanish.

## 1. Flow Summary

The recipe detail gets a share control beside the favorite control. It opens the device's share menu with the recipe's title, photo and link, or copies the link where there is no share menu.

- `SCR-recipe-detail` → (tap share, browser with share menu) → system share menu → (choose an app or cancel) → `SCR-recipe-detail`
- `SCR-recipe-detail` → (tap share, no share menu) → `SCR-recipe-detail` with the notice "Enlace copiado"

## 2. Screens

### 2.1. Recipe detail (`SCR-recipe-detail`, changed)

- **Platform**: Web. **Divergence by detail mode**: `fullscreen` (small windows): icon button on the title row; `modal` (medium) and `panel` (large): labeled button under the photo, in the same row as the favorite button.
- **Purpose**: read the recipe, mark it as favorite and share it.
- **Route / entry point**: `/recipes/<id>`, or opened with `onClose` over Plan or Perfil (unchanged). The control is the same wherever the detail opens.

**Data required**

| Field | Type | Source |
|---|---|---|
| `recipe` | `{ id, title, photoVersion? }` | `findRecipe(library, id)` |
| `link` | string | `shareLink(window.location.origin, recipe.id)` (pure, `lib/domain/share`) |
| `photo` | `File \| undefined` | `GET /api/photo/<id>?v=<photoVersion>`, prefetched when the recipe opens; absent without `photoVersion` or when the fetch fails |
| `busy` | boolean | local state of `useRecipeShare` |
| `notice` | string \| null | local state of `useRecipeShare`, cleared after 4 seconds |

**Component tree** (only what changes)

- `<RecipeContent>` (`components/recipes/detail/RecipeDetail`)
  - Under `<RecipePhoto>`, in the wrapper of the labeled favorite button (hidden in `fullscreen`, same classes): `<ShareButton onShare={share} busy={busy} recipeTitle={recipe.title} label="Compartir" />` (**NEW**, `components/recipes/ShareButton`) after `<FavoriteButton label=... />`; the wrapper is a wrapping flex row with a gap, so the buttons go onto two lines when the column is narrow
  - In the title row (hidden in `modal` and `panel`, as the heart): `<ShareButton onShare={share} busy={busy} recipeTitle={recipe.title} />` after the icon-only `<FavoriteButton />`
  - If `notice !== null`: `<Toast message={notice} />` (reused)
- `useRecipeShare(recipe)` (**NEW**, `components/recipes/detail/use-recipe-share`) returns `{ share, busy, notice }`.

**Conditional rendering states**

- If `recipe === undefined` or the library is loading, render the existing states with no share control.
- If `busy === true`, render `<ShareButton busy />` (disabled, `aria-busy`).
- If `notice !== null`, render `<Toast message={notice} />`.
- Otherwise, the tree above.

**Interactions / transitions** (`share()`)

- If `busy`, ignore the tap.
- If `navigator.share` is a function: set `busy`; wait for the prefetched photo, at most 1.5 seconds; build `buildShare(recipe.title, link, photo)` (with a photo: `{ title, text: title + "\n" + link, files: [photo] }`; without: `{ title, text: title, url: link }`); if it has files and `navigator.canShare(data)` is not true, build it again without the photo; call `navigator.share(data)`.
  - `AbortError` → no notice.
  - Any other error → `notice = "No se pudo compartir"`.
  - Always clear `busy`.
- Otherwise: `navigator.clipboard.writeText(link)` → `notice = "Enlace copiado"`; on failure `notice = "No se pudo copiar el enlace"`.
- Opening another recipe in the same layer (the panel) prefetches that recipe's photo.

### 2.2. ShareButton (component)

- **Props**: `onShare: () => void`, `recipeTitle: string`, `busy?: boolean`, `label?: string`.
- **Rendering**: `<button type="button" disabled={busy} aria-busy={busy} aria-label={label ? undefined : "Compartir: " + recipeTitle}>` with the lucide `Share2` icon; with `label`, the text next to the icon and the width of its content; touch area of at least 44 px. It is not pressed-state: it has no `aria-pressed`.

## 3. Navigation Map

```
Detalle (any mode, from Recetas, Perfil or Plan)
   └─ Compartir ──> menú del sistema ──> app elegida | cancelar ──> Detalle
   └─ Compartir (sin menú) ──> "Enlace copiado" ──> Detalle
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `recipe.id`, `recipe.title`, `recipe.photoVersion` | string | stored library |
| `photo` | `File` (JPEG `<id>.jpg`) | `GET /api/photo/<id>` |
| `link` | string | origin + `/recipes/<id>` |

No data is written and no operation is queued.

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `FavoriteButton` | `components/recipes/FavoriteButton` | 2.1 |
| `Toast` | `components/feedback/Toast` | 2.1 |
| `RecipePhoto`, `DetailLayer` | `components/recipes/RecipePhoto`, `components/overlays/DetailLayer` | 2.1 |

**New**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `ShareButton` | icon-only or labeled share button | 2.1 | Sibling of `FavoriteButton`; add to the registry |

## 6. Deviations from PRD (Approved)

None. The PRD's "wrapping if there is no room" is how the two labeled buttons behave in the large panel, where the photo column is narrow: "Compartir" goes under "Añadir a favoritos" (approved with the prototype, 2026-10-30).

## 7. Open Items

None.
