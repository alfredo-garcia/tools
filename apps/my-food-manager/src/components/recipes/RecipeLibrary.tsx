"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { useListReorder } from "@/components/recipes/use-list-reorder";
import { categoryLabel } from "@/lib/domain/categories";
import { filterRecipes, type FilterState } from "@/lib/domain/filters";
import { useLibrary } from "@/lib/offline/use-library";
import { RecipeDetail } from "@/components/recipes/detail/RecipeDetail";
import { recipeIdFromPath } from "@/components/recipes/detail/use-detail-navigation";
import { RecipeLink } from "@/components/recipes/RecipeLink";

/** Recipe list with filters (features my-food-manager/001 and 003). Rows open the recipe detail (feature my-food-manager/002). */
export function RecipeLibrary() {
  // A recipe detail (`/recipes/<id>`) renders over the list, which stays mounted to keep its scroll.
  const detailId = recipeIdFromPath(usePathname());
  const { hydrated, library, status, warnings, storageOk, refresh } = useLibrary();
  const [filters, setFilters] = useState<FilterState>({});
  const visible = useMemo(
    () => (library ? filterRecipes(library.recipes, filters) : []),
    [library, filters],
  );
  const listRef = useListReorder<HTMLUListElement>(visible.map((r) => r.id).join("|"));

  let content: React.ReactNode;
  if (!hydrated || (!library && status === "syncing") || (!library && status === "idle")) {
    content = <EmptyState emoji="🍳" title="Cargando tus recetas…" />;
  } else if (!library) {
    content = (
      <EmptyState
        emoji={status === "offline" ? "📡" : "⚠️"}
        title={
          status === "offline"
            ? "Necesitas conexión la primera vez"
            : "No se pudo cargar tu biblioteca"
        }
        hint={
          status === "offline"
            ? "Conéctate para descargar tus recetas; después funcionarán sin conexión."
            : "Revisa la conexión con Drive e inténtalo de nuevo."
        }
        action={<Button onClick={() => void refresh()}>Reintentar</Button>}
      />
    );
  } else if (library.recipes.length === 0) {
    content = (
      <EmptyState
        emoji="📖"
        title="No hay recetas todavía"
        hint="Añade recetas a la carpeta de Drive y aparecerán aquí."
      />
    );
  } else {
    content = (
      <>
        <RecipeFilters
          library={library}
          state={filters}
          onChange={setFilters}
          shown={visible.length}
        />
        {warnings.length > 0 && (
          <p className="mb-3 text-sm text-text-muted">{warnings.length} con avisos</p>
        )}
        {visible.length === 0 ? (
          <EmptyState
            emoji="🔎"
            title="Ninguna receta coincide"
            hint="Prueba con otra combinación de filtros."
            action={<Button onClick={() => setFilters({})}>Quitar filtros</Button>}
          />
        ) : (
          <ul ref={listRef} className="relative flex flex-col gap-2">
            {visible.map((r) => (
              <li
                key={r.id}
                data-flip-key={r.id}
                className="rounded-md border border-border bg-surface-1 shadow-elevation-1"
              >
                <RecipeLink
                  recipeId={r.id}
                  className="flex min-h-14 items-center gap-3 rounded-md p-2"
                >
                  <RecipePhoto
                    recipeId={r.id}
                    photoVersion={r.photoVersion}
                    category={r.category}
                    className="size-14 shrink-0 rounded-sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.title}</div>
                    <div className="text-xs text-text-muted">
                      {categoryLabel(library.vocab.categories, r.category)}
                    </div>
                  </div>
                </RecipeLink>
              </li>
            ))}
          </ul>
        )}
        {!storageOk && (
          <p className="mt-4 text-xs text-warning-500">
            Este navegador no permite guardar datos: sin conexión solo verás lo ya cargado.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <div inert={detailId !== undefined}>
        <AppShell title="Recetas">{content}</AppShell>
      </div>
      {detailId !== undefined && <RecipeDetail id={detailId} />}
    </>
  );
}
