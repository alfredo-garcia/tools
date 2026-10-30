"use client";

import { DetailLayer } from "@/components/overlays/DetailLayer";
import { useLayout } from "@/components/layout/use-layout";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { FavoriteButton } from "@/components/recipes/FavoriteButton";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { findRecipe } from "@/lib/domain/recipe-detail";
import { useFavorites } from "@/lib/offline/use-favorites";
import { useLibrary } from "@/lib/offline/use-library";
import type { Library, Recipe } from "@/lib/schema";
import { InfoSection } from "./InfoSection";
import { IngredientsSection } from "./IngredientsSection";
import { NotesSection } from "./NotesSection";
import { StepsSection } from "./StepsSection";
import { useCloseDetail } from "./use-detail-navigation";

/** Keyed by recipe id by the caller, so section state resets when another recipe opens. */
function RecipeContent({ recipe, library }: { recipe: Recipe; library: Library }) {
  const { favorites, toggle } = useFavorites();
  const pressed = favorites.has(recipe.id);
  return (
    <div className="detail-grid mx-auto w-full max-w-3xl pb-10">
      <div className="detail-photo-col">
        <RecipePhoto
          recipeId={recipe.id}
          photoVersion={recipe.photoVersion}
          category={recipe.category}
          className="detail-photo aspect-video w-full"
        />
        {/* Medium and large windows: the labeled button under the photo (the title lives in the layer bar). */}
        <div className="px-4 pt-3 group-data-[detail-mode=fullscreen]:hidden group-data-[detail-mode=panel]:px-0">
          <FavoriteButton
            pressed={pressed}
            onToggle={() => toggle(recipe.id)}
            recipeTitle={recipe.title}
            label={pressed ? "Quitar de favoritos" : "Añadir a favoritos"}
          />
        </div>
      </div>
      <div className="detail-sections px-4 pt-4">
        {/* Small windows: the heart takes the right end of the title row. */}
        <div className="flex items-start gap-2 group-data-[detail-mode=modal]:hidden group-data-[detail-mode=panel]:hidden">
          <h1
            data-detail-title
            className="min-w-0 flex-1 pt-2 text-2xl leading-[1.15] font-extrabold"
          >
            {recipe.title}
          </h1>
          <FavoriteButton
            pressed={pressed}
            onToggle={() => toggle(recipe.id)}
            recipeTitle={recipe.title}
          />
        </div>
        <InfoSection recipe={recipe} library={library} />
        <IngredientsSection recipe={recipe} library={library} />
        <StepsSection recipe={recipe} />
        <NotesSection recipe={recipe} />
      </div>
    </div>
  );
}

/** SCR-recipe-detail: reads the recipe `id` (from the `/recipes/<id>` address) from the stored library. */
export function RecipeDetail({
  id,
  onClose,
  overlay = false,
}: {
  id: string;
  /** Closes the detail when it is not driven by the address (e.g. over the Plan). */
  onClose?: () => void;
  /** Never use the side panel: large windows show a modal (screens with no list beside it). */
  overlay?: boolean;
}) {
  const { hydrated, library, status, refresh } = useLibrary();
  const closeDetail = useCloseDetail();
  const layout = useLayout();
  const mode =
    layout === "small" ? "fullscreen" : layout === "medium" || overlay ? "modal" : "panel";
  const close = () => {
    if (onClose) return onClose();
    // In the side panel focus is not trapped: hand it back to the row that was selected.
    if (mode === "panel")
      document.querySelector<HTMLElement>('[data-recipe-row="current"]')?.focus();
    closeDetail();
  };

  const recipe = library ? findRecipe(library, id) : undefined;
  let body: React.ReactNode;
  if (!hydrated || (!library && (status === "syncing" || status === "idle"))) {
    body = <EmptyState emoji="🍳" title="Cargando tu receta…" />;
  } else if (!library) {
    body = (
      <EmptyState
        emoji={status === "offline" ? "📡" : "⚠️"}
        title={
          status === "offline"
            ? "Necesitas conexión la primera vez"
            : "No se pudo cargar tu biblioteca"
        }
        action={<Button onClick={() => void refresh()}>Reintentar</Button>}
      />
    );
  } else if (!recipe) {
    body = (
      <EmptyState
        emoji="🔍"
        title="Receta no encontrada"
        hint="Puede que se haya borrado de Drive."
        action={<Button onClick={close}>Volver a recetas</Button>}
      />
    );
  }

  return (
    <DetailLayer mode={mode} title={recipe?.title} resetKey={id} onClose={close}>
      {recipe && library ? (
        <RecipeContent key={recipe.id} recipe={recipe} library={library} />
      ) : (
        body
      )}
    </DetailLayer>
  );
}
