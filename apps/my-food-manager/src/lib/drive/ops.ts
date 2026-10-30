import { ApiError } from "@/lib/api/errors";
import { PantryParseError, applyPantryOps, type RawOp } from "@/lib/domain/pantry-ops";
import { parseIngredients } from "@/lib/domain/parse";
import { LIBRARY_PATHS, type DriveFileRef } from "@/lib/domain/snapshot";
import type { OpsResponse } from "@/lib/schema";
import { freshListing, getSource, invalidateListing } from "./library";
import { DriveConflictError, DriveReadError, type FoodSource } from "./types";

/** One write at a time per server instance; Drive's modified-time check covers the rest (ADR 001). */
let queue: Promise<unknown> = Promise.resolve();

function toWriteError(e: unknown): unknown {
  if (e instanceof DriveReadError)
    return new ApiError(e.code, e.code === "DRIVE_FORBIDDEN" ? 403 : 502, e.message);
  return e;
}

export interface OpsDeps {
  source: FoodSource;
  list: () => Promise<DriveFileRef[]>;
  now: () => Date;
}

/** Reads the latest pantry, applies the operations, and writes it once; one retry on a conflict. */
export async function runOps(ops: RawOp[], deps: OpsDeps): Promise<OpsResponse> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const files = await deps.list();
    const pantryFile = files.find((f) => f.path === LIBRARY_PATHS.pantry);
    const catalogFile = files.find((f) => f.path === LIBRARY_PATHS.ingredients);
    if (!pantryFile)
      throw new ApiError("PANTRY_MISSING", 404, "No existe pantry/pantry.yaml en la carpeta food");
    if (!catalogFile)
      throw new ApiError("CATALOG_MISSING", 404, "No existe ingredients/items.yaml");

    let applied;
    try {
      const catalog = parseIngredients(await deps.source.readText(catalogFile));
      applied = applyPantryOps(await deps.source.readText(pantryFile), ops, catalog, deps.now());
    } catch (e) {
      if (e instanceof PantryParseError) throw new ApiError("PANTRY_INVALID", 500, e.message);
      throw e;
    }
    const response: OpsResponse = { results: applied.results, pantry: applied.pantry };
    if (!applied.changed) return response;

    try {
      await deps.source.writeText(pantryFile, applied.text);
      return response;
    } catch (e) {
      if (!(e instanceof DriveConflictError)) throw e;
      if (attempt === 1)
        throw new ApiError("CONFLICT", 409, "La despensa cambió en Drive. Se reintentará.");
    }
  }
  throw new ApiError("CONFLICT", 409, "La despensa cambió en Drive. Se reintentará.");
}

/** Production entry point used by the route handler. */
export function applyOps(ops: RawOp[]): Promise<OpsResponse> {
  const run = async () => {
    try {
      return await runOps(ops, { source: getSource(), list: freshListing, now: () => new Date() });
    } catch (e) {
      throw toWriteError(e);
    } finally {
      invalidateListing();
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}
