import { createHash } from "node:crypto";
import {
  SNAPSHOT_SCHEMA_VERSION,
  type Library,
  type Person,
  type Plan,
  type Recipe,
  type SnapshotResponse,
  type Warning,
} from "@/lib/schema";
import {
  parseIngredients,
  parsePantry,
  parsePlan,
  parseRecipe,
  parseReviews,
  parseVocab,
} from "./parse";

export interface DriveFileRef {
  id: string;
  /** Path relative to the `food` folder, e.g. `recipes/items/05-mains/pollo-al-ajillo.md`. */
  path: string;
  modifiedTime: string;
}

export const LIBRARY_PATHS = {
  ingredients: "ingredients/items.yaml",
  pantry: "pantry/pantry.yaml",
  plan: "plan/plan.yaml",
  categories: "recipes/_system/categories.yaml",
  tags: "recipes/_system/tags.yaml",
  families: "ingredients/_system/families.yaml",
  units: "_system/units.yaml",
} as const;

const RECIPE_PATH = /^recipes\/items\/[^/]+\/[^/]+\.md$/;
const REVIEWS_PATH = /^reviews\/([^/]+)\.ya?ml$/;
const PHOTO_PATH = /^recipes\/_attachments\/([^/]+)\.jpe?g$/i;

/** Files of the folder that belong to the library. */
export function relevantFiles(files: DriveFileRef[]): DriveFileRef[] {
  const fixed = new Set<string>(Object.values(LIBRARY_PATHS));
  return files.filter(
    (f) =>
      fixed.has(f.path) ||
      RECIPE_PATH.test(f.path) ||
      REVIEWS_PATH.test(f.path) ||
      PHOTO_PATH.test(f.path),
  );
}

/** Recipe ids (file names without extension) of a listing; a recipe's id equals its file name. */
export function recipeIdsOf(files: DriveFileRef[]): Set<string> {
  return new Set(
    files
      .filter((f) => RECIPE_PATH.test(f.path))
      .map((f) => f.path.slice(f.path.lastIndexOf("/") + 1).replace(/\.md$/, "")),
  );
}

/** Stable validator: changes when any relevant file is added, removed or modified. */
export function computeEtag(files: DriveFileRef[]): string {
  const lines = relevantFiles(files)
    .map((f) => `${f.path}:${f.id}:${f.modifiedTime}`)
    .sort();
  return `"${createHash("sha1").update(lines.join("\n")).digest("hex")}"`;
}

export function photoFiles(files: DriveFileRef[]): Map<string, DriveFileRef> {
  const out = new Map<string, DriveFileRef>();
  for (const f of files) {
    const m = PHOTO_PATH.exec(f.path);
    if (m) out.set(m[1], f);
  }
  return out;
}

export type ReadText = (file: DriveFileRef) => Promise<string>;

export async function buildSnapshot(
  files: DriveFileRef[],
  read: ReadText,
  now: () => Date = () => new Date(),
): Promise<SnapshotResponse> {
  const relevant = relevantFiles(files);
  const byPath = new Map(relevant.map((f) => [f.path, f]));
  const warnings: Warning[] = [];

  const guarded = async <T>(path: string, fallback: T, fn: (text: string) => T): Promise<T> => {
    const file = byPath.get(path);
    if (!file) {
      warnings.push({ file: path, message: "Archivo no encontrado" });
      return fallback;
    }
    try {
      return fn(await read(file));
    } catch (e) {
      if (e instanceof Error && e.name === "DriveReadError") throw e;
      warnings.push({ file: path, message: (e as Error).message });
      return fallback;
    }
  };

  const photos = photoFiles(relevant);

  const recipeFiles = relevant.filter((f) => RECIPE_PATH.test(f.path));
  const recipeResults = await Promise.all(
    recipeFiles.map(async (f): Promise<Recipe | null> => {
      try {
        const recipe = parseRecipe(await read(f));
        const photo = photos.get(recipe.id);
        return photo ? { ...recipe, photoVersion: photo.modifiedTime } : recipe;
      } catch (e) {
        if (e instanceof Error && e.name === "DriveReadError") throw e;
        warnings.push({ file: f.path, message: (e as Error).message });
        return null;
      }
    }),
  );
  const recipes = recipeResults.filter((r): r is Recipe => r !== null);

  const reviews: Library["reviews"] = {};
  const people: Person[] = [];
  for (const f of relevant.filter((f) => REVIEWS_PATH.test(f.path))) {
    const parsed = await guarded(f.path, null, parseReviews);
    if (!parsed) continue;
    const id = REVIEWS_PATH.exec(f.path)![1];
    reviews[id] = parsed;
    people.push({ id, name: parsed.user.charAt(0).toUpperCase() + parsed.user.slice(1) });
  }
  people.sort((a, b) => a.name.localeCompare(b.name, "es"));

  // A missing plan file is not a warning: the Plan screen shows its own unavailable state.
  const planFile = byPath.get(LIBRARY_PATHS.plan);
  const plan = planFile
    ? await guarded<Plan | undefined>(LIBRARY_PATHS.plan, undefined, parsePlan)
    : undefined;

  const [ingredients, pantry, categories, tags, families, units] = await Promise.all([
    guarded(LIBRARY_PATHS.ingredients, {}, parseIngredients),
    guarded(LIBRARY_PATHS.pantry, { have: [], to_buy: [], updated: undefined }, parsePantry),
    guarded(LIBRARY_PATHS.categories, {}, parseVocab),
    guarded(LIBRARY_PATHS.tags, {}, parseVocab),
    guarded(LIBRARY_PATHS.families, {}, parseVocab),
    guarded(LIBRARY_PATHS.units, {}, parseVocab),
  ]);

  recipes.sort((a, b) => a.title.localeCompare(b.title, "es"));

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    etag: computeEtag(files),
    generatedAt: now().toISOString(),
    data: {
      recipes,
      ingredients,
      pantry,
      ...(plan ? { plan } : {}),
      reviews,
      vocab: { categories, tags, units, families },
      people,
    },
    warnings,
  };
}
