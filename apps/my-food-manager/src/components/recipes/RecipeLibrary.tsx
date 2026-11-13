"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useLayout } from "@/components/layout/use-layout";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";
import { SearchInput } from "@/components/inputs/SearchInput";
import { TmpFilterToggle } from "@/components/inputs/TmpFilterToggle";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { RecipeRow } from "@/components/recipes/RecipeRow";
import { TmpPendingChanges } from "@/components/feedback/TmpPendingChanges";
import { TmpResultGroup } from "@/components/recipes/TmpResultGroup";
import { useListReorder } from "@/components/recipes/use-list-reorder";
import { useSearchQuery } from "@/components/recipes/use-search-query";
import { categoryLabel } from "@/lib/domain/categories";
import {
  DEFAULT_FILTER_STATE,
  activeFilterCount,
  filterRecipes,
  withFavorites,
  type FilterState,
} from "@/lib/domain/filters";
import { sortByRating } from "@/lib/domain/ratings";
import { searchRecipes } from "@/lib/domain/search";
import { OPEN_KEY_DIALOG, useFavorites } from "@/lib/offline/use-favorites";
import { useLibrary } from "@/lib/offline/use-library";
import { useRatings } from "@/lib/offline/use-ratings";
import { useOutbox } from "@/lib/offline/use-outbox";
import { RecipeDetail } from "@/components/recipes/detail/RecipeDetail";
import { recipeIdFromPath } from "@/components/recipes/detail/use-detail-navigation";

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
  const { hydrated, status, warnings, storageOk, refresh } = useLibrary();
  const { library, ratings } = useRatings();
  const { favorites, toggle: toggleFavorite } = useFavorites();
  const outbox = useOutbox();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [panelOpen, setPanelOpen] = useState(false);
  const { typed, applied, setTyped, applyNow, clear } = useSearchQuery();
  const searching = applied !== "";
  // Hearts tapped while shown keep their earlier favorite state for the Favoritos filter until search or filters
  // change, so the row does not move or leave (my-food-manager/016 FR-3).
  const context = `${applied}|${JSON.stringify(filters)}`;
  const [kept, setKept] = useState<{ context: string; was: ReadonlyMap<string, boolean> }>({
    context,
    was: new Map(),
  });
  const keptWas = kept.context === context ? kept.was : undefined;
  const filterFavorites = useMemo(() => {
    if (!keptWas?.size) return favorites;
    const out = new Set(favorites);
    for (const [id, was] of keptWas)
      if (was) out.add(id);
      else out.delete(id);
    return out;
  }, [favorites, keptWas]);
  const flagged = useMemo(
    () =>
      library
        ? { ...library, recipes: withFavorites(library.recipes, filterFavorites) }
        : undefined,
    [library, filterFavorites],
  );
  const visible = useMemo(
    () => (flagged ? sortByRating(filterRecipes(flagged.recipes, filters)) : []),
    [flagged, filters],
  );
  const results = useMemo(
    () => (flagged && searching ? searchRecipes(flagged, applied, filters) : undefined),
    [flagged, searching, applied, filters],
  );
  const onToggleFavorite = (id: string) => {
    const was = keptWas ?? new Map<string, boolean>();
    if (!was.has(id)) setKept({ context, was: new Map(was).set(id, favorites.has(id)) });
    toggleFavorite(id);
  };
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
      <RecipeRow
        key={key}
        flipKey={key}
        recipe={r}
        categoryLabel={categoryLabel(library.vocab.categories, r.category)}
        favorite={favorites.has(r.id)}
        rating={ratings.get(r.id)}
        onToggleFavorite={() => onToggleFavorite(r.id)}
        current={r.id === detailId}
        replace={large && detailId !== undefined}
      />
    );
    const noResults = results ? results.groups.length === 0 : visible.length === 0;
    content = (
      <>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={typed}
              onChange={setTyped}
              onClear={clear}
              onSubmit={applyNow}
              placeholder="Buscar por nombre, proteína o ingrediente"
              label="Buscar recetas"
            />
          </div>
          <TmpFilterToggle
            expanded={panelOpen}
            count={activeFilterCount(filters)}
            onToggle={() => setPanelOpen((o) => !o)}
            controls="recipe-filters"
          />
        </div>
        <RecipeFilters
          library={flagged ?? library}
          state={filters}
          onChange={setFilters}
          shown={shown}
          searching={searching}
          expanded={panelOpen}
          withFavorites
          panelId="recipe-filters"
        />
        {outbox.pending.length > 0 && (
          <TmpPendingChanges
            count={outbox.pending.length}
            keyNeeded={!outbox.hasKey || outbox.keyRejected}
            onEnterKey={() => window.dispatchEvent(new Event(OPEN_KEY_DIALOG))}
          />
        )}
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
