import { parseDocument } from "yaml";
import type { OpResult, OpsResponse } from "@/lib/schema";

export class PantryParseError extends Error {}

const KIND_FIELD = { "pantry.setHave": "have", "pantry.setBuy": "to_buy" } as const;

export interface RawOp {
  id: string;
  kind: string;
  ingredient: string;
  value: unknown;
}

export interface ApplyResult {
  /** New file text; equal to the input when nothing changed. */
  text: string;
  changed: boolean;
  results: OpResult[];
  pantry: OpsResponse["pantry"];
}

/** ISO 8601 with the `-05:00` offset the Drive files use (tech_standards §5). */
export function timestampWithOffset(now: Date): string {
  const shifted = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return `${shifted.toISOString().slice(0, 19)}-05:00`;
}

const asIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

const unique = (ids: string[]) => [...new Set(ids)];

const reject = (id: string, message: string): OpResult => ({
  id,
  status: "rejected",
  error: { code: "INVALID_OP", message },
});

/**
 * Applies set-to-value operations to the text of `pantry.yaml`, in order.
 * Comments and fields the app does not know are kept; the file is rewritten (and `updated` set)
 * only when the final `have` or `to_buy` differ from what the file had.
 */
export function applyPantryOps(
  text: string,
  ops: RawOp[],
  knownIngredients: ReadonlySet<string>,
  now: Date,
): ApplyResult {
  const doc = parseDocument(text);
  if (doc.errors.length > 0)
    throw new PantryParseError(`pantry.yaml inválido: ${doc.errors[0].message.split("\n")[0]}`);
  const current = (doc.toJS() ?? {}) as Record<string, unknown>;

  const start = { have: unique(asIds(current.have)), to_buy: unique(asIds(current.to_buy)) };
  const lists = { have: [...start.have], to_buy: [...start.to_buy] };
  const results: OpResult[] = [];

  for (const op of ops) {
    const field = KIND_FIELD[op.kind as keyof typeof KIND_FIELD];
    if (!field) {
      results.push(reject(op.id, "Tipo de operación desconocido"));
    } else if (typeof op.value !== "boolean") {
      results.push(reject(op.id, "El valor debe ser verdadero o falso"));
    } else if (!knownIngredients.has(op.ingredient)) {
      results.push(reject(op.id, "Ingrediente desconocido"));
    } else {
      const list = lists[field];
      const present = list.includes(op.ingredient);
      if (op.value && !present) {
        list.push(op.ingredient);
        results.push({ id: op.id, status: "applied" });
      } else if (!op.value && present) {
        lists[field] = list.filter((i) => i !== op.ingredient);
        results.push({ id: op.id, status: "applied" });
      } else results.push({ id: op.id, status: "unchanged" });
    }
  }

  const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  const changed = !same(start.have, lists.have) || !same(start.to_buy, lists.to_buy);

  if (!changed) {
    return {
      text,
      changed,
      results,
      pantry: {
        updated: typeof current.updated === "string" ? current.updated : undefined,
        ...lists,
      },
    };
  }

  const updated = timestampWithOffset(now);
  if (doc.contents == null)
    doc.contents = doc.createNode({}) as unknown as NonNullable<typeof doc.contents>;
  doc.set("have", doc.createNode(lists.have));
  doc.set("to_buy", doc.createNode(lists.to_buy));
  doc.set("updated", updated);
  return { text: doc.toString({ lineWidth: 0 }), changed, results, pantry: { updated, ...lists } };
}
