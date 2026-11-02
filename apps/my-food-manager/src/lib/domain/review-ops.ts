import { isMap, isSeq, parseDocument, type YAMLMap } from "yaml";
import type { OpResult } from "@/lib/schema";
import { timestampWithOffset, type RawOp } from "./pantry-ops";

export class ReviewParseError extends Error {}

/** The only reviews file the app writes until the Perfil feature adds the person picker. */
export const REVIEWS_USER = "al";

export interface ReviewApplyResult {
  text: string;
  changed: boolean;
  results: OpResult[];
  reviews: {
    user: string;
    updated?: string;
    favorites: string[];
    ratings: Record<string, number>;
  };
  /** Recipes that got a rating (applied or already that value): the caller then makes them Probada (ADR 004). */
  rated: string[];
}

const reject = (id: string, message: string): OpResult => ({
  id,
  status: "rejected",
  error: { code: "INVALID_OP", message },
});

/** A rating is an integer from 1 to 5; anything else in a file reads as no rating. */
export const validStars = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

function ratingsOf(doc: ReturnType<typeof parseDocument>): Record<string, number> {
  const raw = doc.get("ratings");
  const out: Record<string, number> = {};
  if (!isMap(raw)) return out;
  for (const pair of raw.items) {
    const key = String((pair.key as { value?: unknown }).value ?? pair.key);
    const entry = isMap(pair.value) ? pair.value.get("stars") : undefined;
    if (validStars(entry)) out[key] = entry;
  }
  return out;
}

/**
 * Applies `review.setFavorite` and `review.setRating` operations to the text of `reviews/al.yaml` (reviews
 * schema 1). Only `favorites`, `ratings[recipe]` and `updated` change; comments and fields the app does not know
 * stay as the file had them. Setting a rating keeps the entry's `comment`; removing it deletes the entry. The
 * file is rewritten only when something differs from what it had.
 */
export function applyReviewOps(
  text: string,
  ops: RawOp[],
  recipeIds: ReadonlySet<string>,
  now: Date,
): ReviewApplyResult {
  const doc = parseDocument(text);
  if (doc.errors.length > 0)
    throw new ReviewParseError(`reviews/al.yaml inválido: ${doc.errors[0].message.split("\n")[0]}`);
  if (!isMap(doc.contents) || doc.get("user") !== REVIEWS_USER)
    throw new ReviewParseError("reviews/al.yaml no usa el esquema 1 de Al");

  const raw = doc.get("favorites");
  const start: string[] = isSeq(raw)
    ? raw.items.map((i) => String((i as { value?: unknown }).value ?? i))
    : [];
  const favorites = [...start];
  const startRatings = ratingsOf(doc);
  const ratings = { ...startRatings };
  const results: OpResult[] = [];
  const rated = new Set<string>();

  for (const op of ops) {
    if (op.kind !== "review.setFavorite" && op.kind !== "review.setRating") {
      results.push(reject(op.id, "Tipo de operación desconocido"));
    } else if (!op.recipe || !recipeIds.has(op.recipe)) {
      results.push(reject(op.id, "Receta desconocida"));
    } else if (op.kind === "review.setRating") {
      if (op.value !== null && !validStars(op.value)) {
        results.push(reject(op.id, "El rating debe ser un entero de 1 a 5 o nulo"));
      } else {
        const before = ratings[op.recipe];
        if (op.value === null) delete ratings[op.recipe];
        else {
          ratings[op.recipe] = op.value;
          rated.add(op.recipe);
        }
        results.push({
          id: op.id,
          status: (op.value ?? undefined) === before ? "unchanged" : "applied",
        });
      }
    } else if (typeof op.value !== "boolean") {
      results.push(reject(op.id, "El valor debe ser verdadero o falso"));
    } else {
      const at = favorites.indexOf(op.recipe);
      if (at >= 0 === op.value) {
        results.push({ id: op.id, status: "unchanged" });
      } else {
        if (op.value) favorites.push(op.recipe);
        else favorites.splice(at, 1);
        results.push({ id: op.id, status: "applied" });
      }
    }
  }

  const sameFavorites =
    favorites.length === start.length && favorites.every((v, i) => v === start[i]);
  const sameRatings = JSON.stringify(sortKeys(ratings)) === JSON.stringify(sortKeys(startRatings));
  const current = doc.get("updated");
  const summary = (updated: string | undefined) => ({
    user: REVIEWS_USER,
    updated,
    favorites,
    ratings,
  });
  if (sameFavorites && sameRatings) {
    return {
      text,
      changed: false,
      results,
      reviews: summary(typeof current === "string" ? current : undefined),
      rated: [...rated],
    };
  }

  const updated = timestampWithOffset(now);
  if (sameRatings) {
    const patched = patchText(text, favorites, updated);
    if (patched !== null) {
      try {
        const check = parseDocument(patched).toJS() as { favorites?: unknown };
        if (JSON.stringify(check.favorites ?? []) === JSON.stringify(favorites))
          return {
            text: patched,
            changed: true,
            results,
            reviews: summary(updated),
            rated: [...rated],
          };
      } catch {
        // Fall through to the full rewrite.
      }
    }
  }
  if (!sameFavorites) {
    if (isSeq(raw)) {
      raw.items = [];
      for (const id of favorites) raw.add(doc.createNode(id));
    } else {
      doc.set("favorites", doc.createNode(favorites, { flow: true }));
    }
  }
  if (!sameRatings) {
    const date = updated.slice(0, 10);
    for (const id of new Set([...Object.keys(startRatings), ...Object.keys(ratings)])) {
      if (ratings[id] === startRatings[id]) continue;
      if (ratings[id] === undefined) {
        const map = doc.get("ratings");
        if (isMap(map)) map.delete(id);
        continue;
      }
      const map = ensureRatingsMap(doc);
      const entry = map.get(id, true);
      if (isMap(entry)) {
        entry.set("stars", ratings[id]);
        entry.set("date", date);
      } else {
        const node = doc.createNode({ stars: ratings[id], date });
        node.flow = true;
        map.set(id, node);
      }
    }
  }
  doc.set("updated", updated);
  return {
    text: doc.toString({ lineWidth: 0, flowCollectionPadding: false }),
    changed: true,
    results,
    reviews: summary(updated),
    rated: [...rated],
  };
}

function ensureRatingsMap(doc: ReturnType<typeof parseDocument>): YAMLMap {
  const existing = doc.get("ratings");
  if (isMap(existing)) return existing;
  const created = doc.createNode({}) as YAMLMap;
  doc.set("ratings", created);
  return created;
}

const sortKeys = (o: Record<string, number>) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

/**
 * Edits only the `favorites:` and `updated:` lines when the list is written inline (`favorites: [a, b]`, the form
 * the food-manager skill uses), so comments and layout stay byte for byte. Null when the file is laid out otherwise.
 */
function patchText(text: string, favorites: string[], updated: string): string | null {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^favorites:\s*\[.*\]\s*(#.*)?$/.test(l));
  const up = lines.findIndex((l) => /^updated:/.test(l));
  if (at < 0 || up < 0) return null;
  lines[at] = `favorites: [${favorites.join(", ")}]`;
  lines[up] = `updated: ${updated}`;
  return lines.join("\n");
}
