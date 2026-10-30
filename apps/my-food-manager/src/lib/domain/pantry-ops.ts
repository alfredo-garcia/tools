import { isMap, parseDocument } from "yaml";
import type { OpResult, OpsResponse } from "@/lib/schema";

export class PantryParseError extends Error {}

const KIND_FIELD = { "pantry.setHave": "have", "pantry.setBuy": "to_buy" } as const;

export interface RawOp {
  id: string;
  kind: string;
  ingredient?: string;
  value?: unknown;
  /** Plan operations (ADR 003). */
  date?: string;
  meal?: string;
  recipe?: string;
}

/** What the catalog says about each ingredient id; staples never appear in the pantry. */
export type PantryCatalog = Record<string, { staple?: boolean }>;

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

const reject = (id: string, message: string): OpResult => ({
  id,
  status: "rejected",
  error: { code: "INVALID_OP", message },
});

type Items = Record<string, { have?: unknown; to_buy?: unknown } | null | undefined>;

/** Ids with the field set to true, in file order. */
function idsWith(items: Items, field: "have" | "to_buy"): string[] {
  return Object.entries(items)
    .filter(([, entry]) => entry?.[field] === true)
    .map(([id]) => id);
}

const itemsOf = (doc: ReturnType<typeof parseDocument>): Items =>
  ((doc.toJS() as { items?: Items } | null)?.items ?? {}) as Items;

type Change = { have?: boolean; to_buy?: boolean };
const BOOL = (value: boolean) => (value ? "true" : "false");

/** Sets one boolean inside the braces of an entry line, keeping the column alignment of the other values. */
function setFlag(braces: string, field: "have" | "to_buy", value: boolean): string | null {
  const re = new RegExp(`(${field}:\\s*)(true|false)(,?)(\\s*)`);
  const m = re.exec(braces);
  if (!m) return null;
  const grow = BOOL(value).length - m[2].length;
  // "false" is one character longer than "true": in aligned files give that column back when shrinking.
  const gap = grow > 0 && m[4].length > 1 ? m[4].slice(1) : m[4];
  return braces.replace(re, `$1${BOOL(value)}$3${gap}`);
}

/**
 * Edits only the lines that change, so the layout the food-manager skill gave the file (aligned columns,
 * comments, section headers) stays as it was. Returns null when a line is not in the expected one-line form;
 * the caller then falls back to re-serializing the document.
 */
function patchText(text: string, changes: Map<string, Change>, updated: string): string | null {
  const lines = text.split("\n");
  const entry = /^(\s+)([A-Za-z0-9_-]+)(:\s*)\{(.*)\}(\s*(?:#.*)?)$/;
  let lastEntry = -1;
  let indent = "  ";
  const seen = new Set<string>();
  lines.forEach((line, i) => {
    const m = entry.exec(line);
    if (!m) return;
    lastEntry = i;
    indent = m[1];
    const change = changes.get(m[2]);
    if (!change) return;
    let braces = m[4];
    for (const field of ["have", "to_buy"] as const) {
      if (change[field] === undefined) continue;
      const next = setFlag(braces, field, change[field]);
      if (next === null) return;
      braces = next;
    }
    lines[i] = `${m[1]}${m[2]}${m[3]}{${braces}}${m[5]}`;
    seen.add(m[2]);
  });
  const missing = [...changes.keys()].filter((id) => !seen.has(id));
  if (missing.length > 0) {
    if (lastEntry < 0) return null;
    const added = missing.map((id) => {
      const c = changes.get(id)!;
      return `${indent}${id}: { have: ${BOOL(c.have === true)}, to_buy: ${BOOL(c.to_buy === true)} }`;
    });
    lines.splice(lastEntry + 1, 0, ...added);
  }
  const at = lines.findIndex((l) => /^updated:/.test(l));
  if (at < 0) return null;
  lines[at] = `updated: ${updated}`;
  return lines.join("\n");
}

/**
 * Applies set-to-value operations to the text of `pantry.yaml` (schema 2: `items: { <id>: { have, to_buy } }`).
 * Only the touched `have` / `to_buy` values change; comments, layout and fields the app does not know are
 * kept. An ingredient of the catalog with no entry yet gets one. The file is rewritten (and `updated` set)
 * only when the final pantry differs from what the file had.
 */
export function applyPantryOps(
  text: string,
  ops: RawOp[],
  catalog: PantryCatalog,
  now: Date,
): ApplyResult {
  const doc = parseDocument(text);
  if (doc.errors.length > 0)
    throw new PantryParseError(`pantry.yaml inválido: ${doc.errors[0].message.split("\n")[0]}`);
  if (!isMap(doc.get("items")))
    throw new PantryParseError("pantry.yaml no usa el esquema 2: falta el mapa `items`");

  const before = itemsOf(doc);
  const start = { have: idsWith(before, "have"), to_buy: idsWith(before, "to_buy") };
  const results: OpResult[] = [];

  for (const op of ops) {
    const field = KIND_FIELD[op.kind as keyof typeof KIND_FIELD];
    const ingredient = op.ingredient ?? "";
    const entry = catalog[ingredient];
    if (!field) {
      results.push(reject(op.id, "Tipo de operación desconocido"));
    } else if (typeof op.value !== "boolean") {
      results.push(reject(op.id, "El valor debe ser verdadero o falso"));
    } else if (!entry) {
      results.push(reject(op.id, "Ingrediente desconocido"));
    } else if (entry.staple) {
      results.push(reject(op.id, "Los básicos no se guardan en la despensa"));
    } else {
      const current = doc.getIn(["items", ingredient, field]) === true;
      if (current === op.value) {
        results.push({ id: op.id, status: "unchanged" });
      } else {
        if (!isMap(doc.getIn(["items", ingredient])))
          doc.setIn(
            ["items", ingredient],
            doc.createNode({ have: false, to_buy: false }, { flow: true }),
          );
        doc.setIn(["items", ingredient, field], op.value);
        results.push({ id: op.id, status: "applied" });
      }
    }
  }

  const after = itemsOf(doc);
  const final = { have: idsWith(after, "have"), to_buy: idsWith(after, "to_buy") };
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  const changed = !same(start.have, final.have) || !same(start.to_buy, final.to_buy);

  if (!changed) {
    const updated = (doc.toJS() as { updated?: unknown }).updated;
    return {
      text,
      changed,
      results,
      pantry: { updated: typeof updated === "string" ? updated : undefined, ...final },
    };
  }

  const updated = timestampWithOffset(now);
  doc.set("updated", updated);
  const changes = new Map<string, Change>();
  for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const diff: Change = {};
    for (const field of ["have", "to_buy"] as const) {
      const was = before[id]?.[field] === true;
      const is = after[id]?.[field] === true;
      if (was !== is) diff[field] = is;
    }
    if (diff.have !== undefined || diff.to_buy !== undefined) changes.set(id, diff);
  }
  // Prefer the surgical edit; use it only if it reads back as exactly the pantry the operations produced.
  let out = patchText(text, changes, updated);
  if (out !== null) {
    try {
      const check = itemsOf(parseDocument(out));
      if (
        !same(idsWith(check, "have"), final.have) ||
        !same(idsWith(check, "to_buy"), final.to_buy)
      )
        out = null;
    } catch {
      out = null;
    }
  }
  return {
    text: out ?? doc.toString({ lineWidth: 0 }),
    changed,
    results,
    pantry: { updated, ...final },
  };
}
