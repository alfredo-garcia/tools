"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DetailLayer } from "@/components/overlays/DetailLayer";
import { useLayout } from "@/components/layout/use-layout";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { FavoriteButton } from "@/components/recipes/FavoriteButton";
import { RatingStars } from "@/components/recipes/RatingStars";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { ShareButton } from "@/components/recipes/ShareButton";
import { Toast } from "@/components/feedback/Toast";
import { findRecipe } from "@/lib/domain/recipe-detail";
import { useFavorites } from "@/lib/offline/use-favorites";
import { useLibrary } from "@/lib/offline/use-library";
import { useRatings } from "@/lib/offline/use-ratings";
import type { Library, Recipe } from "@/lib/schema";
import { InfoSection } from "./InfoSection";
import { DetailShortcuts } from "./DetailShortcuts";
import { IngredientsSection } from "./IngredientsSection";
import { NotesSection } from "./NotesSection";
import { ShoppingListSheet } from "./ShoppingListSheet";
import { StepsSection } from "./StepsSection";
import { useCloseDetail } from "./use-detail-navigation";
import { useRecipeShare } from "./use-recipe-share";

/** Keyed by recipe id by the caller, so section state resets when another recipe opens. */
function RecipeContent({
  recipe,
  library,
  onAddToPlan,
}: {
  recipe: Recipe;
  library: Library;
  onAddToPlan?: (recipeId: string) => void;
}) {
  const router = useRouter();
  const [shopping, setShopping] = useState(false);
  // Small windows open on the ingredients: the layout when the recipe opens decides, a later resize does not.
  const layout = useLayout();
  const [detailsOpen] = useState(layout !== "small");
  const shortcuts = (
    <DetailShortcuts
      onShopping={() => setShopping(true)}
      onPlan={() =>
        onAddToPlan
          ? onAddToPlan(recipe.id)
          : router.push(`/plan?add=${encodeURIComponent(recipe.id)}`)
      }
    />
  );
  const { favorites, toggle } = useFavorites();
  const pressed = favorites.has(recipe.id);
  const { ratings, rate } = useRatings();
  const stars = ratings.get(recipe.id);
  const rating = (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <RatingStars
        value={stars ?? 0}
        onChange={(n) => rate(recipe.id, n)}
        recipeTitle={recipe.title}
      />
      <span aria-live="polite" className="text-sm font-semibold text-text-muted">
        {stars === undefined ? "Sin rating" : `${stars} de 5`}
      </span>
    </div>
  );
  const { share, busy, notice } = useRecipeShare(recipe);
  return (
    <div className="detail-grid mx-auto w-full max-w-3xl pb-10">
      <div className="detail-photo-col">
        <RecipePhoto
          recipeId={recipe.id}
          photoVersion={recipe.photoVersion}
          category={recipe.category}
          className="detail-photo aspect-video w-full"
        />
        {/* Medium and large windows: rating, favorite and share in one row under the photo when they fit; otherwise the
            rating takes its own row and the two buttons share the next (the title lives in the layer bar). */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3 group-data-[detail-mode=fullscreen]:hidden group-data-[detail-mode=panel]:px-0">
          <div className="-ml-2.5">{rating}</div>
          <div className="flex flex-wrap gap-2">
            <FavoriteButton
              pressed={pressed}
              onToggle={() => toggle(recipe.id)}
              recipeTitle={recipe.title}
              label={pressed ? "Quitar de favoritos" : "Añadir a favoritos"}
            />
            <ShareButton onShare={share} busy={busy} subject={recipe.title} label="Compartir" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-4 pt-2 group-data-[detail-mode=fullscreen]:hidden group-data-[detail-mode=panel]:px-0">
          {shortcuts}
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
          <ShareButton onShare={share} busy={busy} subject={recipe.title} />
        </div>
        <div className="-ml-2.5 group-data-[detail-mode=modal]:hidden group-data-[detail-mode=panel]:hidden">
          {rating}
        </div>
        {/* Small windows: favorite and the two shortcuts stacked, all the width of the content. */}
        <div className="mt-1 flex flex-col gap-2 group-data-[detail-mode=modal]:hidden group-data-[detail-mode=panel]:hidden">
          <FavoriteButton
            pressed={pressed}
            onToggle={() => toggle(recipe.id)}
            recipeTitle={recipe.title}
            label={pressed ? "Quitar de favoritos" : "Añadir a favoritos"}
            fullWidth
          />
          {shortcuts}
        </div>
        <InfoSection recipe={recipe} library={library} defaultOpen={detailsOpen} />
        <IngredientsSection recipe={recipe} library={library} />
        <StepsSection recipe={recipe} />
        <NotesSection recipe={recipe} defaultOpen={detailsOpen} />
      </div>
      {notice && <Toast message={notice} />}
      {shopping && (
        <ShoppingListSheet recipe={recipe} library={library} onClose={() => setShopping(false)} />
      )}
    </div>
  );
}

/** SCR-recipe-detail: reads the recipe `id` (from the `/recipes/<id>` address) from the stored library. */
export function RecipeDetail({
  id,
  onClose,
  overlay = false,
  onAddToPlan,
}: {
  id: string;
  /** Closes the detail when it is not driven by the address (e.g. over the Plan). */
  onClose?: () => void;
  /** Never use the side panel: large windows show a modal (screens with no list beside it). */
  overlay?: boolean;
  /** Screens that already are the Plan take over "Añadir al plan"; elsewhere it goes to `/plan`. */
  onAddToPlan?: (recipeId: string) => void;
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
        <RecipeContent
          key={recipe.id}
          recipe={recipe}
          library={library}
          onAddToPlan={onAddToPlan}
        />
      ) : (
        body
      )}
    </DetailLayer>
  );
}
