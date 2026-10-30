import { isMap, isSeq, parseDocument } from "yaml";
import type { OpResult } from "@/lib/schema";
import { timestampWithOffset, type RawOp } from "./pantry-ops";

export class ReviewParseError extends Error {}

/** The only reviews file the app writes until the Perfil feature adds the person picker. */
export const REVIEWS_USER = "al";

export interface ReviewApplyResult {
  text: string;
  changed: boolean;
  results: OpResult[];
  reviews: { user: string; updated?: string; favorites: string[] };
}

const reject = (id: string, message: string): OpResult => ({
  id,
  status: "rejected",
  error: { code: "INVALID_OP", message },
});

/**
 * Applies `review.setFavorite` operations to the text of `reviews/al.yaml` (reviews schema 1). Only `favorites`
 * and `updated` change; `ratings`, comments and fields the app does not know stay as the file had them.
 * The file is rewritten only when the final list differs from what it had.
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
  const results: OpResult[] = [];

  for (const op of ops) {
    if (op.kind !== "review.setFavorite") {
      results.push(reject(op.id, "Tipo de operación desconocido"));
    } else if (typeof op.value !== "boolean") {
      results.push(reject(op.id, "El valor debe ser verdadero o falso"));
    } else if (!op.recipe || !recipeIds.has(op.recipe)) {
      results.push(reject(op.id, "Receta desconocida"));
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

  const same = favorites.length === start.length && favorites.every((v, i) => v === start[i]);
  const current = doc.get("updated");
  if (same) {
    return {
      text,
      changed: false,
      results,
      reviews: {
        user: REVIEWS_USER,
        updated: typeof current === "string" ? current : undefined,
        favorites,
      },
    };
  }

  const updated = timestampWithOffset(now);
  const patched = patchText(text, favorites, updated);
  if (patched !== null) {
    try {
      const check = parseDocument(patched).toJS() as { favorites?: unknown };
      if (JSON.stringify(check.favorites ?? []) === JSON.stringify(favorites))
        return {
          text: patched,
          changed: true,
          results,
          reviews: { user: REVIEWS_USER, updated, favorites },
        };
    } catch {
      // Fall through to the full rewrite.
    }
  }
  if (isSeq(raw)) {
    raw.items = [];
    for (const id of favorites) raw.add(doc.createNode(id));
  } else {
    doc.set("favorites", doc.createNode(favorites, { flow: true }));
  }
  doc.set("updated", updated);
  return {
    text: doc.toString({ lineWidth: 0, flowCollectionPadding: false }),
    changed: true,
    results,
    reviews: { user: REVIEWS_USER, updated, favorites },
  };
}

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
