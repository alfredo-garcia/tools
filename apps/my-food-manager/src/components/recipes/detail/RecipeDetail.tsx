"use client";

import { DetailLayer } from "@/components/overlays/DetailLayer";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { findRecipe } from "@/lib/domain/recipe-detail";
import { useLibrary } from "@/lib/offline/use-library";
import type { Library, Recipe } from "@/lib/schema";
import { InfoSection } from "./InfoSection";
import { IngredientsSection } from "./IngredientsSection";
import { NotesSection } from "./NotesSection";
import { StepsSection } from "./StepsSection";
import { useCloseDetail } from "./use-detail-navigation";

/** Keyed by recipe id by the caller, so section state resets when another recipe opens. */
function RecipeContent({ recipe, library }: { recipe: Recipe; library: Library }) {
  return (
    <>
      <RecipePhoto
        recipeId={recipe.id}
        photoVersion={recipe.photoVersion}
        category={recipe.category}
        className="aspect-video w-full"
      />
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
        <h1 data-detail-title className="text-2xl leading-[1.15] font-extrabold lg:hidden">
          {recipe.title}
        </h1>
        <InfoSection recipe={recipe} library={library} />
        <IngredientsSection recipe={recipe} library={library} />
        <StepsSection recipe={recipe} />
        <NotesSection recipe={recipe} />
      </div>
    </>
  );
}

/** SCR-recipe-detail: reads the recipe `id` (from the `/recipes/<id>` address) from the stored library. */
export function RecipeDetail({ id }: { id: string }) {
  const { hydrated, library, status, refresh } = useLibrary();
  const close = useCloseDetail();

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
    <DetailLayer title={recipe?.title} resetKey={id} onClose={close}>
      {recipe && library ? (
        <RecipeContent key={recipe.id} recipe={recipe} library={library} />
      ) : (
        body
      )}
    </DetailLayer>
  );
}
