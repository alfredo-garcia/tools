import { FavoriteButton } from "@/components/recipes/FavoriteButton";
import { RecipeLink } from "@/components/recipes/RecipeLink";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import type { Recipe } from "@/lib/schema";

/** A recipe in a list: photo, title and category open the detail; the heart at the right toggles the favorite. */
export function RecipeRow({
  recipe,
  categoryLabel,
  favorite,
  onToggleFavorite,
  current = false,
  dimmed = false,
  replace = false,
  onOpen,
  flipKey,
}: {
  recipe: Recipe;
  categoryLabel: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  /** The recipe open in the side panel. */
  current?: boolean;
  /** Unfavorited while shown in the favorites tab: stays until the view changes. */
  dimmed?: boolean;
  replace?: boolean;
  /** Opens the detail without changing the address (Perfil); absent in Recetas, where the row is a link. */
  onOpen?: (id: string) => void;
  flipKey: string;
}) {
  const body = (
    <>
      <RecipePhoto
        recipeId={recipe.id}
        photoVersion={recipe.photoVersion}
        category={recipe.category}
        className="size-14 shrink-0 rounded-sm"
      />
      <div className="min-w-0">
        <div className="truncate font-semibold">{recipe.title}</div>
        <div className="text-xs text-text-muted">{categoryLabel}</div>
      </div>
    </>
  );
  const linkClass = `flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-md p-2 text-left ${
    dimmed ? "opacity-50" : ""
  }`;
  return (
    <li
      data-flip-key={flipKey}
      className={`flex items-center rounded-md border shadow-elevation-1 ${
        current ? "border-primary-500 bg-primary-500/15" : "border-border bg-surface-1"
      }`}
    >
      {onOpen ? (
        <button type="button" onClick={() => onOpen(recipe.id)} className={linkClass}>
          {body}
        </button>
      ) : (
        <RecipeLink recipeId={recipe.id} current={current} replace={replace} className={linkClass}>
          {body}
        </RecipeLink>
      )}
      <div className="pr-1">
        <FavoriteButton pressed={favorite} onToggle={onToggleFavorite} recipeTitle={recipe.title} />
      </div>
    </li>
  );
}
