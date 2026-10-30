"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TmpPendingChanges } from "@/components/feedback/TmpPendingChanges";
import { Button } from "@/components/inputs/Button";
import { SearchInput } from "@/components/inputs/SearchInput";
import { TmpSegmentedControl } from "@/components/inputs/TmpSegmentedControl";
import { AppShell } from "@/components/layout/AppShell";
import { RecipeDetail } from "@/components/recipes/detail/RecipeDetail";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { RecipeRow } from "@/components/recipes/RecipeRow";
import { TmpResultGroup } from "@/components/recipes/TmpResultGroup";
import { useListReorder } from "@/components/recipes/use-list-reorder";
import { useSearchQuery } from "@/components/recipes/use-search-query";
import { categoryLabel } from "@/lib/domain/categories";
import { favoriteRecipes } from "@/lib/domain/favorites";
import { activeFilterCount, filterRecipes, type FilterState } from "@/lib/domain/filters";
import { searchRecipes } from "@/lib/domain/search";
import { OPEN_KEY_DIALOG, useFavorites } from "@/lib/offline/use-favorites";
import { useLibrary } from "@/lib/offline/use-library";
import { useOutbox } from "@/lib/offline/use-outbox";

const EMPTY: ReadonlySet<string> = new Set();
const TABS = [{ value: "favoritas", label: "Recetas favoritas" }];

/** Perfil: a tab bar with one tab, "Recetas favoritas", listing only Al's favorites like Recetas does. */
export function ProfileScreen() {
  const router = useRouter();
  const { hydrated, library, status, storageOk, refresh } = useLibrary();
  const outbox = useOutbox();
  const { favorites, toggle } = useFavorites();
  const [filters, setFilters] = useState<FilterState>({});
  const { typed, applied, setTyped, applyNow, clear } = useSearchQuery();
  const [openId, setOpenId] = useState<string | null>(null);
  // Recipes unfavorited while shown stay (dimmed) until search or filters change.
  const context = `${applied}|${JSON.stringify(filters)}`;
  const [kept, setKept] = useState<{ context: string; ids: ReadonlySet<string> }>({
    context,
    ids: EMPTY,
  });
  const keptIds = kept.context === context ? kept.ids : EMPTY;

  const searching = applied !== "";
  const filtersActive = activeFilterCount(filters) > 0;
  const favLibrary = useMemo(
    () =>
      library
        ? { ...library, recipes: favoriteRecipes(library.recipes, favorites, keptIds) }
        : undefined,
    [library, favorites, keptIds],
  );
  const visible = useMemo(
    () => (favLibrary ? filterRecipes(favLibrary.recipes, filters) : []),
    [favLibrary, filters],
  );
  const results = useMemo(
    () => (favLibrary && searching ? searchRecipes(favLibrary, applied, filters) : undefined),
    [favLibrary, searching, applied, filters],
  );
  const listRef = useListReorder<HTMLDivElement>(
    results
      ? results.groups.flatMap((g) => g.recipes.map((r) => `${g.key}:${r.id}`)).join("|")
      : visible.map((r) => r.id).join("|"),
  );

  const onToggle = (id: string) => {
    if (favorites.has(id)) setKept({ context, ids: new Set([...keptIds, id]) });
    toggle(id);
  };

  let content: React.ReactNode;
  if (!hydrated || (!library && (status === "syncing" || status === "idle"))) {
    content = <EmptyState emoji="🍳" title="Cargando tus recetas…" />;
  } else if (!library || !favLibrary) {
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
  } else if (favLibrary.recipes.length === 0) {
    content = (
      <EmptyState
        emoji="💚"
        title="Aún no tienes favoritas"
        hint="Toca el corazón de una receta para guardarla aquí."
        action={<Button onClick={() => router.push("/")}>Ver recetas</Button>}
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
        dimmed={!favorites.has(r.id)}
        onToggleFavorite={() => onToggle(r.id)}
        onOpen={setOpenId}
      />
    );
    const shown = results ? results.total : visible.length;
    const noResults = results ? results.groups.length === 0 : visible.length === 0;
    content = (
      <>
        <SearchInput
          value={typed}
          onChange={setTyped}
          onClear={clear}
          onSubmit={applyNow}
          placeholder="Buscar en tus favoritas"
          label="Buscar recetas"
        />
        <RecipeFilters
          library={favLibrary}
          state={filters}
          onChange={setFilters}
          shown={shown}
          searching={searching}
        />
        {outbox.pending.length > 0 && (
          <TmpPendingChanges
            count={outbox.pending.length}
            keyNeeded={!outbox.hasKey || outbox.keyRejected}
            onEnterKey={() => window.dispatchEvent(new Event(OPEN_KEY_DIALOG))}
          />
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
          <div ref={listRef} className="relative mt-3">
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
    <AppShell title="Perfil">
      <TmpSegmentedControl
        kind="tabs"
        ariaLabel="Perfil"
        items={TABS}
        value="favoritas"
        onChange={() => undefined}
      />
      {content}
      {openId && <RecipeDetail id={openId} overlay onClose={() => setOpenId(null)} />}
    </AppShell>
  );
}
