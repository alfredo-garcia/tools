import { z } from "zod";

// Mirrors food/_system/schema.md. Unknown fields are preserved (looseObject).

export const SNAPSHOT_SCHEMA_VERSION = 1;

const optionalString = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined);

export const ingredientLineSchema = z.looseObject({
  ing: z.string(),
  qty: z.number().optional(),
  unit: optionalString,
  note: optionalString,
  group: optionalString,
  optional: z.boolean().optional(),
  recipe: optionalString,
});

export const recipeSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().optional().default("unclassified"),
  tags: z
    .record(z.string(), z.array(z.string()))
    .nullish()
    .transform((v) => v ?? {}),
  servings: z
    .object({ qty: z.number().optional(), unit: optionalString })
    .nullish()
    .transform((v) => v ?? undefined),
  time: z
    .object({
      prep: z.number().optional(),
      cook: z.number().optional(),
      rest: z.number().optional(),
    })
    .nullish()
    .transform((v) => v ?? undefined),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .nullish()
    .transform((v) => v ?? undefined),
  ingredients: z
    .array(ingredientLineSchema)
    .nullish()
    .transform((v) => v ?? []),
  source: z
    .looseObject({
      type: optionalString,
      url: optionalString,
      author: optionalString,
      original: optionalString,
    })
    .nullish()
    .transform((v) => v ?? undefined),
  curated: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
  missing: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  doubts: optionalString,
  created: optionalString,
  updated: optionalString,
});

export type Recipe = z.infer<typeof recipeSchema> & {
  steps: string[];
  notes: string;
  variations: string;
  /** Present when a photo exists in Drive; used to version the photo URL. */
  photoVersion?: string;
};

export const ingredientCatalogEntrySchema = z.looseObject({
  name: z.string(),
  synonyms: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  family: optionalString,
  staple: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
});
export type IngredientCatalogEntry = z.infer<typeof ingredientCatalogEntrySchema>;

export const pantrySchema = z.looseObject({
  updated: optionalString,
  have: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  to_buy: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
});
export type Pantry = z.infer<typeof pantrySchema>;

export const reviewsSchema = z.looseObject({
  user: z.string(),
  updated: optionalString,
  favorites: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  ratings: z
    .record(
      z.string(),
      z.looseObject({ stars: z.number(), comment: optionalString, date: optionalString }),
    )
    .nullish()
    .transform((v) => v ?? {}),
});
export type Reviews = z.infer<typeof reviewsSchema>;

export const personSchema = z.object({ id: z.string(), name: z.string() });
export type Person = z.infer<typeof personSchema>;

export const librarySchema = z.object({
  recipes: z.array(z.looseObject({ id: z.string(), title: z.string() })),
  ingredients: z.record(z.string(), z.looseObject({ name: z.string() })),
  pantry: z.looseObject({ have: z.array(z.string()), to_buy: z.array(z.string()) }),
  reviews: z.record(z.string(), z.looseObject({ user: z.string() })),
  vocab: z.object({
    categories: z.record(z.string(), z.unknown()),
    tags: z.record(z.string(), z.unknown()),
    units: z.record(z.string(), z.unknown()),
    families: z.record(z.string(), z.unknown()),
  }),
  people: z.array(personSchema),
});

export type Library = Omit<
  z.infer<typeof librarySchema>,
  "recipes" | "ingredients" | "pantry" | "reviews"
> & {
  recipes: Recipe[];
  ingredients: Record<string, IngredientCatalogEntry>;
  pantry: Pantry;
  reviews: Record<string, Reviews>;
};

export const warningSchema = z.object({ file: z.string(), message: z.string() });
export type Warning = z.infer<typeof warningSchema>;

export const snapshotResponseSchema = z.object({
  schemaVersion: z.number(),
  etag: z.string(),
  generatedAt: z.string(),
  data: librarySchema,
  warnings: z.array(warningSchema),
});
export type SnapshotResponse = Omit<z.infer<typeof snapshotResponseSchema>, "data"> & {
  data: Library;
};

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
