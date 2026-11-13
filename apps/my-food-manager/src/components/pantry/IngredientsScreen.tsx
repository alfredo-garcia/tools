"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/inputs/Button";
import { FilterChip } from "@/components/inputs/FilterChip";
import { FilterOptions } from "@/components/inputs/FilterOptions";
import { SearchInput } from "@/components/inputs/SearchInput";
import { TmpFilterToggle } from "@/components/inputs/TmpFilterToggle";
import { TmpSwitch } from "@/components/inputs/TmpSwitch";
import { TmpSegmentedControl } from "@/components/inputs/TmpSegmentedControl";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TmpPendingChanges } from "@/components/feedback/TmpPendingChanges";
import { Toast } from "@/components/feedback/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { useLayout } from "@/components/layout/use-layout";
import { ShareButton } from "@/components/recipes/ShareButton";
import { TmpResultGroup } from "@/components/recipes/TmpResultGroup";
import { useSearchQuery } from "@/components/recipes/use-search-query";
import { IngredientRow } from "./IngredientRow";
import { KeyDialog } from "./KeyDialog";
import { useListShare } from "./use-list-share";
import {
  baseList,
  buyCount,
  catalogItems,
  familyLabel,
  familyOptions,
  groupByFamily,
  inFamily,
  isAtHome,
  listBuyFlip,
  pantryWithPending,
  shoppingListText,
  sortByName,
  type PantryTab,
  type StateFilter,
} from "@/lib/domain/pantry-view";
import { useLibrary } from "@/lib/offline/use-library";
import { getOutbox } from "@/lib/offline/outbox-client";
import { useOutbox } from "@/lib/offline/use-outbox";
import type { PantryOpKind } from "@/lib/schema";

const NOTICE_MS = 4000;
const EMPTY: ReadonlySet<string> = new Set();

const STATES: { value: StateFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "tengo", label: "Tengo" },
  { value: "notengo", label: "No tengo" },
];

/** Despensa (the pantry, `tab="despensa"`) or Compra (the shopping list, `tab="lista"`), over the same catalog. */
export function IngredientsScreen({ tab }: { tab: PantryTab }) {
  const router = useRouter();
  const layout = useLayout();
  const { hydrated, library, status, storageOk, refresh } = useLibrary();
  const outbox = useOutbox();
  const search = useSearchQuery();
  const [state, setState] = useState<StateFilter>("todos");
  const [family, setFamily] = useState<string>();
  const [familyOpen, setFamilyOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyDismissed, setKeyDismissed] = useState(false);
  const [rejectionClosed, setRejectionClosed] = useState(false);
  // Rows that changed while shown stay until the view they belong to changes.
  const context = `${tab}|${state}|${family ?? ""}|${search.applied}`;
  const [kept, setKept] = useState<{ context: string; ids: ReadonlySet<string> }>({
    context,
    ids: EMPTY,
  });
  // Rows turned off in Compra stay struck through until leaving it.
  const [struck, setStruck] = useState<ReadonlySet<string>>(EMPTY);
  // Rows of Compra whose "Tengo" was turned on by turning "Comprar" off; turning it back on undoes it.
  const [autoHave, setAutoHave] = useState<ReadonlySet<string>>(EMPTY);
  const keepVisible = kept.context === context ? kept.ids : EMPTY;

  const items = useMemo(() => (library ? catalogItems(library.ingredients) : []), [library]);
  const view = useMemo(
    () =>
      library ? pantryWithPending(library.pantry, outbox.pending) : { have: EMPTY, buy: EMPTY },
    [library, outbox.pending],
  );
  const vocab = library?.vocab.families ?? {};

  const base = baseList(items, view, {
    tab,
    state,
    applied: search.applied,
    keepVisible,
    struck,
  });
  const options = familyOptions(base, vocab);
  const rows = sortByName(inFamily(base, family));
  const toBuyCount = buyCount(items, view);
  const listShare = useListShare(shoppingListText(items, view.buy, vocab));

  // A key the server refused reopens the dialog with its error until the user closes it.
  const keyDialogOpen = keyOpen || (outbox.keyRejected && !rejectionClosed);
  const notice = outbox.notices.find((n) => !n.favorite);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => getOutbox().dismissNotice(notice.id), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const send = (kind: PantryOpKind, id: string, value: boolean) => {
    if (!library) return;
    const stored = kind === "pantry.setHave" ? library.pantry.have : library.pantry.to_buy;
    void getOutbox().enqueue(kind, id, value, stored.includes(id));
  };

  const flip = (id: string, kind: PantryOpKind) => {
    if (!library) return;
    const now = kind === "pantry.setHave" ? view.have.has(id) : view.buy.has(id);
    if (kind === "pantry.setBuy" && tab === "lista") {
      const item = items.find((i) => i.id === id);
      const next = listBuyFlip({
        toBuy: now,
        atHome: item ? isAtHome(item, view) : view.have.has(id),
        autoHave: autoHave.has(id),
      });
      for (const op of next.ops) send(op.kind, id, op.value);
      const nextStruck = new Set(struck);
      if (now) nextStruck.add(id);
      else nextStruck.delete(id);
      setStruck(nextStruck);
      const nextAuto = new Set(autoHave);
      if (next.autoHave) nextAuto.add(id);
      else nextAuto.delete(id);
      setAutoHave(nextAuto);
    } else {
      send(kind, id, !now);
      if (kind === "pantry.setHave" && tab === "despensa")
        setKept({ context, ids: new Set(keepVisible).add(id) });
      if (kind === "pantry.setHave" && autoHave.has(id)) {
        const nextAuto = new Set(autoHave);
        nextAuto.delete(id);
        setAutoHave(nextAuto);
      }
    }
    if (!outbox.hasKey && !keyDismissed) setKeyOpen(true);
  };

  const closeKey = () => {
    setKeyOpen(false);
    setKeyDismissed(true);
    setRejectionClosed(true);
  };

  const noText = () => {
    search.clear();
  };

  let content: React.ReactNode;
  if (!hydrated || (!library && (status === "syncing" || status === "idle"))) {
    content = <EmptyState emoji="🥫" title="Cargando tu despensa…" />;
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
            ? "Conéctate para descargar tus datos; después funcionarán sin conexión."
            : "Revisa la conexión con Drive e inténtalo de nuevo."
        }
        action={<Button onClick={() => void refresh()}>Reintentar</Button>}
      />
    );
  } else {
    const filtered = search.applied !== "" || family !== undefined;
    const row = (item: (typeof rows)[number]) => (
      <IngredientRow
        key={item.id}
        item={item}
        tab={tab}
        atHome={isAtHome(item, view)}
        toBuy={view.buy.has(item.id)}
        struck={tab === "lista" && !view.buy.has(item.id)}
        onFlip={flip}
      />
    );
    content = (
      <>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search.typed}
              onChange={search.setTyped}
              onClear={noText}
              onSubmit={search.applyNow}
              placeholder="Buscar ingrediente"
              label="Buscar ingrediente"
            />
          </div>
          {tab === "lista" && toBuyCount > 0 && (
            <ShareButton
              onShare={() => void listShare.share()}
              busy={listShare.busy}
              subject="Lista de compra"
              label={layout === "small" ? undefined : "Compartir"}
              round={layout === "small"}
            />
          )}
          <TmpFilterToggle
            expanded={panelOpen}
            count={family === undefined ? 0 : 1}
            onToggle={() => {
              setPanelOpen((o) => !o);
              setFamilyOpen(false);
            }}
            controls="pantry-filters"
          />
        </div>
        {panelOpen && (
          <div id="pantry-filters" className="mt-3">
            <div className="flex">
              <FilterChip
                label="Familia"
                value={family ? familyLabel(vocab, family) : undefined}
                open={familyOpen}
                onToggle={() => setFamilyOpen((o) => !o)}
                onClear={() => {
                  setFamily(undefined);
                  setFamilyOpen(false);
                }}
              />
            </div>
            {familyOpen && family === undefined && (
              <div
                className="mt-2 rounded-md border border-border bg-surface-1 p-3"
                onKeyDown={(e) => e.key === "Escape" && setFamilyOpen(false)}
              >
                <FilterOptions
                  label="Familia"
                  options={options}
                  selected={family}
                  onSelect={(value) => {
                    setFamily(value);
                    setFamilyOpen(false);
                  }}
                />
              </div>
            )}
            <div className="mt-2 flex min-h-12 items-center justify-between gap-3">
              <span className="text-sm font-semibold">
                Agrupar por familia
              </span>
              <TmpSwitch
                label=""
                tone="primary"
                checked={grouped}
                ariaLabel="Agrupar por familia"
                onChange={() => setGrouped((g) => !g)}
              />
            </div>
          </div>
        )}
        {tab === "despensa" && (
          <div className="mt-3">
            <TmpSegmentedControl
              kind="radio"
              ariaLabel="Estado"
              value={state}
              onChange={setState}
              items={STATES}
            />
          </div>
        )}
        {outbox.pending.length > 0 && (
          <TmpPendingChanges
            count={outbox.pending.length}
            keyNeeded={!outbox.hasKey || outbox.keyRejected}
            onEnterKey={() => setKeyOpen(true)}
          />
        )}
        {rows.length > 0 ? (
          grouped ? (
            <div className="mt-4">
              {groupByFamily(rows, vocab).map((g) => (
                <TmpResultGroup key={g.value} label={g.label} count={g.items.length}>
                  <ul>{g.items.map(row)}</ul>
                </TmpResultGroup>
              ))}
            </div>
          ) : (
            <ul className="mt-2">{rows.map(row)}</ul>
          )
        ) : tab === "lista" && !filtered && struck.size === 0 ? (
          <EmptyState
            emoji="🛒"
            title="Tu lista está vacía"
            hint="Activa Comprar en un ingrediente de Despensa."
            action={<Button onClick={() => router.push("/ingredients")}>Ir a Despensa</Button>}
          />
        ) : (
          <EmptyState
            emoji="🔎"
            title="Ningún ingrediente coincide"
            hint="Prueba con otra búsqueda o quita filtros."
            action={
              filtered && (
                <div className="flex flex-wrap justify-center gap-2">
                  {search.applied !== "" && (
                    <Button variant="secondary" onClick={noText}>
                      Borrar búsqueda
                    </Button>
                  )}
                  {family !== undefined && (
                    <Button variant="secondary" onClick={() => setFamily(undefined)}>
                      Quitar filtros
                    </Button>
                  )}
                </div>
              )
            }
          />
        )}
        {(!storageOk || !outbox.storageOk) && (
          <p className="mt-4 text-xs text-warning-500">
            Este navegador no permite guardar datos: los cambios pendientes se perderán si cierras
            la app.
          </p>
        )}
      </>
    );
  }

  return (
    <AppShell title={tab === "lista" ? "Lista de compra" : "Despensa"}>
      {content}
      <div aria-live="polite" className="sr-only">
        {outbox.pending.length > 0 ? `${outbox.pending.length} cambios pendientes` : ""}
      </div>
      {keyDialogOpen && (
        <KeyDialog
          rejected={outbox.keyRejected}
          onSave={(key) => {
            setKeyOpen(false);
            setKeyDismissed(false);
            setRejectionClosed(false);
            getOutbox().setKey(key);
          }}
          onClose={closeKey}
        />
      )}
      {listShare.notice ? (
        <Toast message={listShare.notice} />
      ) : (
        notice?.ingredient && (
          <Toast message={`No se pudo guardar ${nameOf(items, notice.ingredient)}`} />
        )
      )}
    </AppShell>
  );
}

function nameOf(items: { id: string; name: string }[], id: string): string {
  return items.find((i) => i.id === id)?.name ?? id;
}
