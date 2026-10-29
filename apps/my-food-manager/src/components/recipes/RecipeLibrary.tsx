"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useLayout } from "@/components/layout/use-layout";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { SearchInput } from "@/components/inputs/SearchInput";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { TmpResultGroup } from "@/components/recipes/TmpResultGroup";
import { useListReorder } from "@/components/recipes/use-list-reorder";
import { useSearchQuery } from "@/components/recipes/use-search-query";
import { categoryLabel } from "@/lib/domain/categories";
import { activeFilterCount, filterRecipes, type FilterState } from "@/lib/domain/filters";
import { searchRecipes } from "@/lib/domain/search";
import { useLibrary } from "@/lib/offline/use-library";
import { RecipeDetail } from "@/components/recipes/detail/RecipeDetail";
import { recipeIdFromPath } from "@/components/recipes/detail/use-detail-navigation";
import { RecipeLink } from "@/components/recipes/RecipeLink";

/**
 * Recipe list with filters (features my-food-manager/001 and 003) and the recipe detail
 * (002). Large windows show the list as a column with the detail in a panel beside it (004);
 * smaller ones show the detail over the list.
 */
export function RecipeLibrary() {
  // A recipe detail (`/recipes/<id>`) renders over (or beside) the list, which stays mounted to keep its scroll.
  const detailId = recipeIdFromPath(usePathname());
  const layout = useLayout();
  const large = layout === "large";
  const columnRef = useRef<HTMLDivElement>(null);
  const previousLayout = useRef(layout);
  const { hydrated, library, status, warnings, storageOk, refresh } = useLibrary();
  const [filters, setFilters] = useState<FilterState>({});
  const { typed, applied, setTyped, applyNow, clear } = useSearchQuery();
  const searching = applied !== "";
  const visible = useMemo(
    () => (library ? filterRecipes(library.recipes, filters) : []),
    [library, filters],
  );
  const results = useMemo(
    () => (library && searching ? searchRecipes(library, applied, filters) : undefined),
    [library, searching, applied, filters],
  );
  // The list scrolls with the page below the large layout and inside its column in it. The offset is
  // tracked as it changes because the browser clamps the page scroll as soon as the layout switches.
  const listOffset = useRef(0);
  useEffect(() => {
    if (large) return;
    const onScroll = () => {
      listOffset.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [large]);
  useLayoutEffect(() => {
    const was = previousLayout.current;
    previousLayout.current = layout;
    if (was === layout) return;
    if (layout === "large" && columnRef.current) {
      columnRef.current.scrollTop = listOffset.current;
      window.scrollTo(0, 0);
    } else if (was === "large") {
      window.scrollTo(0, listOffset.current);
    }
  }, [layout]);

  const listRef = useListReorder<HTMLDivElement>(
    results
      ? results.groups.flatMap((g) => g.recipes.map((r) => `${g.key}:${r.id}`)).join("|")
      : visible.map((r) => r.id).join("|"),
  );
  const shown = results ? results.total : visible.length;
  const filtersActive = activeFilterCount(filters) > 0;

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
    const row = (r: (typeof visible)[number], key: string) => (
      <li
        key={key}
        data-flip-key={key}
        className={`rounded-md border shadow-elevation-1 ${
          r.id === detailId ? "border-primary-500 bg-primary-500/15" : "border-border bg-surface-1"
        }`}
      >
        <RecipeLink
          recipeId={r.id}
          current={r.id === detailId}
          replace={large && detailId !== undefined}
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
    );
    const noResults = results ? results.groups.length === 0 : visible.length === 0;
    content = (
      <>
        <SearchInput
          value={typed}
          onChange={setTyped}
          onClear={clear}
          onSubmit={applyNow}
          placeholder="Buscar por nombre, proteína o ingrediente"
          label="Buscar recetas"
        />
        <RecipeFilters
          library={library}
          state={filters}
          onChange={setFilters}
          shown={shown}
          searching={searching}
        />
        {warnings.length > 0 && (
          <p className="mb-3 text-sm text-text-muted">{warnings.length} con avisos</p>
        )}
        {noResults ? (
          <EmptyState
            emoji="🔎"
            title="Ninguna receta coincide"
            hint={
              searching
                ? filtersActive
                  ? "Prueba con otro texto o quita filtros."
                  : "Prueba con otro texto."
                : "Prueba con otra combinación de filtros."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {searching && <Button onClick={clear}>Borrar búsqueda</Button>}
                {filtersActive && (
                  <Button
                    variant={searching ? "secondary" : "primary"}
                    onClick={() => setFilters({})}
                  >
                    Quitar filtros
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <div ref={listRef} className="relative">
            {results ? (
              results.groups.map((g) => (
                <TmpResultGroup key={g.key} label={g.label} count={g.recipes.length}>
                  <ul className="flex flex-col gap-2">
                    {g.recipes.map((r) => row(r, `${g.key}:${r.id}`))}
                  </ul>
                </TmpResultGroup>
              ))
            ) : (
              <ul className="flex flex-col gap-2">{visible.map((r) => row(r, r.id))}</ul>
            )}
          </div>
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
    <div className={large ? "flex h-dvh overflow-hidden" : undefined}>
      <div
        ref={columnRef}
        inert={detailId !== undefined && !large}
        data-scroll-region={large ? "" : undefined}
        onScroll={
          large
            ? (e) => {
                listOffset.current = e.currentTarget.scrollTop;
              }
            : undefined
        }
        className={
          large ? "h-full w-[400px] shrink-0 overflow-y-auto border-r border-border" : undefined
        }
      >
        <AppShell title="Recetas">{content}</AppShell>
      </div>
      {detailId !== undefined ? (
        <RecipeDetail id={detailId} />
      ) : (
        large && (
          <div className="grid h-full min-w-0 flex-1 place-items-center">
            <EmptyState
              emoji="🍽️"
              title="Elige una receta"
              hint="Se abrirá aquí, sin perder la lista."
            />
          </div>
        )
      )}
    </div>
  );
}
