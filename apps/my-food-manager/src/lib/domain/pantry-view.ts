import type { FilterOption } from "@/lib/domain/filters";
import { normalize } from "@/lib/domain/search";
import type { Library, PantryOp, PlanOp, ReviewOp } from "@/lib/schema";

/** A change made on this device and not confirmed by the server yet. */
export type PendingOp = PantryOp | PlanOp | ReviewOp;
export const isPantryOp = (op: PendingOp): op is PantryOp =>
  op.kind === "pantry.setHave" || op.kind === "pantry.setBuy";
export const isReviewOp = (op: PendingOp): op is ReviewOp => op.kind === "review.setFavorite";
export type PantryTab = "despensa" | "lista";
export type StateFilter = "tengo" | "notengo" | "todos";

export const DEFAULT_FAMILY = "other";

export interface IngredientItem {
  id: string;
  name: string;
  synonyms: string[];
  family: string;
  staple: boolean;
}

/** Pantry as shown: what is stored plus the pending changes applied in order. */
export interface PantryView {
  have: ReadonlySet<string>;
  buy: ReadonlySet<string>;
}

export interface ListQuery {
  tab: PantryTab;
  state: StateFilter;
  /** Applied search text; "" when there is none. */
  applied: string;
  /** Ids whose "Tengo" changed while shown (Despensa): they stay until the filters change. */
  keepVisible: ReadonlySet<string>;
  /** Ids turned off while shown (Lista): they stay, struck through, until the tab changes. */
  struck: ReadonlySet<string>;
}

const collator = new Intl.Collator("es");

export function catalogItems(ingredients: Library["ingredients"]): IngredientItem[] {
  return Object.entries(ingredients).map(([id, entry]) => ({
    id,
    name: entry.name,
    synonyms: entry.synonyms ?? [],
    family: entry.family || DEFAULT_FAMILY,
    staple: entry.staple ?? false,
  }));
}

export function pantryWithPending(
  pantry: Pick<Library["pantry"], "have" | "to_buy">,
  pending: readonly PendingOp[],
): PantryView {
  const have = new Set(pantry.have);
  const buy = new Set(pantry.to_buy);
  for (const op of pending) {
    if (!isPantryOp(op)) continue;
    const set = op.kind === "pantry.setHave" ? have : buy;
    if (op.value) set.add(op.ingredient);
    else set.delete(op.ingredient);
  }
  return { have, buy };
}

/** "Tengo" is on for what is in `have` and for staples, which are always available. */
export const isAtHome = (item: IngredientItem, view: PantryView) =>
  item.staple || view.have.has(item.id);

export function matchesText(item: IngredientItem, applied: string): boolean {
  const wanted = normalize(applied).split(/\s+/).filter(Boolean);
  if (wanted.length === 0) return true;
  return [item.name, ...item.synonyms].some((term) => {
    const haystack = normalize(term);
    return wanted.every((w) => haystack.includes(w));
  });
}

/** The tab's list before the family filter. An applied search replaces the Tengo / No tengo filter. */
export function baseList(
  items: readonly IngredientItem[],
  view: PantryView,
  query: ListQuery,
): IngredientItem[] {
  return items.filter((item) => {
    if (query.applied && !matchesText(item, query.applied)) return false;
    if (query.tab === "lista") return view.buy.has(item.id) || query.struck.has(item.id);
    if (query.applied || query.state === "todos") return true;
    const home = isAtHome(item, view);
    return (query.state === "tengo" ? home : !home) || query.keepVisible.has(item.id);
  });
}

export const inFamily = (items: IngredientItem[], family: string | undefined) =>
  family ? items.filter((i) => i.family === family) : items;

export const sortByName = (items: IngredientItem[]) =>
  [...items].sort((a, b) => collator.compare(a.name, b.name));

export const buyCount = (items: readonly IngredientItem[], view: PantryView) =>
  items.filter((i) => view.buy.has(i.id)).length;

export function familyLabel(vocab: Library["vocab"]["families"], id: string): string {
  const label = (vocab[id] as { label?: unknown } | undefined)?.label;
  if (typeof label === "string") return label;
  return id === DEFAULT_FAMILY ? "Otros" : id.charAt(0).toUpperCase() + id.slice(1);
}

/** Families present in the list, in vocabulary order (unknown ones last, alphabetically), with their counts. */
export function familyOptions(
  list: readonly IngredientItem[],
  vocab: Library["vocab"]["families"],
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const item of list) counts.set(item.family, (counts.get(item.family) ?? 0) + 1);
  const order = Object.keys(vocab);
  const known = order.filter((id) => counts.has(id));
  const unknown = [...counts.keys()].filter((id) => !order.includes(id)).sort(collator.compare);
  return [...known, ...unknown].map((id) => ({
    value: id,
    label: familyLabel(vocab, id),
    count: counts.get(id) ?? 0,
  }));
}
