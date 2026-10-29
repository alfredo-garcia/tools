"use client";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { categoryLabel } from "@/lib/domain/categories";
import { useLibrary } from "@/lib/offline/use-library";

/** Minimal proof screen for the library (feature my-food-manager/001); browse UI comes with backlog #2. */
export default function Home() {
  const { hydrated, library, status, warnings, storageOk, refresh } = useLibrary();

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
        <p className="mb-3 text-sm text-text-muted">
          {library.recipes.length} {library.recipes.length === 1 ? "receta" : "recetas"}
          {warnings.length > 0 && ` · ${warnings.length} con avisos`}
        </p>
        <ul className="flex flex-col gap-2">
          {library.recipes.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-1 p-2 shadow-elevation-1"
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
            </li>
          ))}
        </ul>
        {!storageOk && (
          <p className="mt-4 text-xs text-warning-500">
            Este navegador no permite guardar datos: sin conexión solo verás lo ya cargado.
          </p>
        )}
      </>
    );
  }

  return <AppShell title="Recetas">{content}</AppShell>;
}
