import { ApiError } from "@/lib/api/errors";
import { PantryParseError, applyPantryOps, type RawOp } from "@/lib/domain/pantry-ops";
import { PlanParseError, applyPlanOps } from "@/lib/domain/plan-ops";
import { REVIEWS_USER, ReviewParseError, applyReviewOps } from "@/lib/domain/review-ops";
import { parseIngredients } from "@/lib/domain/parse";
import { LIBRARY_PATHS, recipeIdsOf, type DriveFileRef } from "@/lib/domain/snapshot";
import type { OpResult, OpsResponse } from "@/lib/schema";
import { freshListing, getSource, invalidateListing } from "./library";
import { DriveConflictError, DriveReadError, type FoodSource } from "./types";

/** One write at a time per server instance; Drive's modified-time check covers the rest (ADR 001). */
let queue: Promise<unknown> = Promise.resolve();

/**
 * Plan operations this instance already applied. A retry after a lost response must not add a recipe twice;
 * the memory is per instance and best effort (ADR 003).
 */
const APPLIED_TTL_MS = 10 * 60 * 1000;
const appliedPlanOps = new Map<string, number>();

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

const conflict = (what: string) =>
  new ApiError("CONFLICT", 409, `${what} cambió en Drive. Se reintentará.`);

const isPlanOp = (op: RawOp) => op.kind.startsWith("plan.");
const isReviewOp = (op: RawOp) => op.kind.startsWith("review.");
const REVIEWS_PATH = `reviews/${REVIEWS_USER}.yaml`;

interface Group<T> {
  results: OpResult[];
  value: T | undefined;
}

/** Reads the latest pantry, applies the operations, and writes it once; one retry on a conflict. */
async function runPantryGroup(
  ops: RawOp[],
  deps: OpsDeps,
): Promise<Group<NonNullable<OpsResponse["pantry"]>>> {
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
    const group = { results: applied.results, value: applied.pantry };
    if (!applied.changed) return group;

    try {
      await deps.source.writeText(pantryFile, applied.text);
      return group;
    } catch (e) {
      if (!(e instanceof DriveConflictError)) throw e;
      if (attempt === 1) throw conflict("La despensa");
    }
  }
  throw conflict("La despensa");
}

/** Same as the pantry, for `plan/plan.yaml`. A missing or unreadable plan rejects its operations instead of failing the batch. */
async function runPlanGroup(
  ops: RawOp[],
  deps: OpsDeps,
): Promise<Group<NonNullable<OpsResponse["plan"]>>> {
  const rejectAll = (code: string, message: string): Group<never> => ({
    results: ops.map((o) => ({ id: o.id, status: "rejected", error: { code, message } })),
    value: undefined,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const files = await deps.list();
    const planFile = files.find((f) => f.path === LIBRARY_PATHS.plan);
    if (!planFile) return rejectAll("PLAN_MISSING", "No existe plan/plan.yaml en la carpeta food");

    let applied;
    try {
      applied = applyPlanOps(
        await deps.source.readText(planFile),
        ops,
        recipeIdsOf(files),
        deps.now(),
      );
    } catch (e) {
      if (e instanceof PlanParseError) return rejectAll("PLAN_INVALID", e.message);
      throw e;
    }
    const group = { results: applied.results, value: applied.plan };
    if (!applied.changed) return group;

    try {
      await deps.source.writeText(planFile, applied.text);
      return group;
    } catch (e) {
      if (!(e instanceof DriveConflictError)) throw e;
      if (attempt === 1) throw conflict("El plan");
    }
  }
  throw conflict("El plan");
}

/** Same as the plan, for Al's `reviews/al.yaml` (favorites only). */
async function runReviewsGroup(
  ops: RawOp[],
  deps: OpsDeps,
): Promise<Group<NonNullable<OpsResponse["reviews"]>>> {
  const rejectAll = (code: string, message: string): Group<never> => ({
    results: ops.map((o) => ({ id: o.id, status: "rejected", error: { code, message } })),
    value: undefined,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const files = await deps.list();
    const reviewsFile = files.find((f) => f.path === REVIEWS_PATH);
    if (!reviewsFile)
      return rejectAll("REVIEWS_MISSING", `No existe ${REVIEWS_PATH} en la carpeta food`);

    let applied;
    try {
      applied = applyReviewOps(
        await deps.source.readText(reviewsFile),
        ops,
        recipeIdsOf(files),
        deps.now(),
      );
    } catch (e) {
      if (e instanceof ReviewParseError) return rejectAll("REVIEWS_INVALID", e.message);
      throw e;
    }
    const group = { results: applied.results, value: applied.reviews };
    if (!applied.changed) return group;

    try {
      await deps.source.writeText(reviewsFile, applied.text);
      return group;
    } catch (e) {
      if (!(e instanceof DriveConflictError)) throw e;
      if (attempt === 1) throw conflict("Tus favoritos");
    }
  }
  throw conflict("Tus favoritos");
}

/**
 * Applies a batch. Operations are grouped by file and each file is read, written and retried on its own;
 * the pantry and the favorites go first and the plan last, so a retry after a partial failure only repeats
 * idempotent changes (ADR 003). Results come back in the order of the request.
 */
export async function runOps(ops: RawOp[], deps: OpsDeps): Promise<OpsResponse> {
  const pantryOps = ops.filter((o) => !isPlanOp(o) && !isReviewOp(o));
  const reviewOps = ops.filter(isReviewOp);
  const planOps = ops.filter(isPlanOp);
  const response: OpsResponse = { results: [] };
  const byId = new Map<string, OpResult>();

  if (pantryOps.length > 0) {
    const group = await runPantryGroup(pantryOps, deps);
    group.results.forEach((r) => byId.set(r.id, r));
    response.pantry = group.value;
  }
  if (reviewOps.length > 0) {
    const group = await runReviewsGroup(reviewOps, deps);
    group.results.forEach((r) => byId.set(r.id, r));
    response.reviews = group.value;
  }
  if (planOps.length > 0) {
    const group = await runPlanGroup(planOps, deps);
    group.results.forEach((r) => byId.set(r.id, r));
    response.plan = group.value;
  }
  response.results = ops.map((o) => byId.get(o.id)!);
  return response;
}

/** Production entry point used by the route handler. */
export function applyOps(ops: RawOp[]): Promise<OpsResponse> {
  const run = async () => {
    try {
      const nowMs = Date.now();
      for (const [id, at] of appliedPlanOps)
        if (nowMs - at > APPLIED_TTL_MS) appliedPlanOps.delete(id);
      const seen = new Set(
        ops.filter((o) => isPlanOp(o) && appliedPlanOps.has(o.id)).map((o) => o.id),
      );
      const fresh = ops.filter((o) => !seen.has(o.id));
      const response =
        fresh.length > 0
          ? await runOps(fresh, { source: getSource(), list: freshListing, now: () => new Date() })
          : ({ results: [] } as OpsResponse);
      const byId = new Map(response.results.map((r) => [r.id, r]));
      for (const o of fresh)
        if (isPlanOp(o) && byId.get(o.id)?.status === "applied") appliedPlanOps.set(o.id, nowMs);
      response.results = ops.map((o) => byId.get(o.id) ?? { id: o.id, status: "unchanged" });
      return response;
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
