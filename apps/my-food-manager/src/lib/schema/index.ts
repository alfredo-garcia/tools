import { z } from "zod";

// Mirrors food/_system/schema.md. Unknown fields are preserved (looseObject).

export const SNAPSHOT_SCHEMA_VERSION = 2;

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

/** `pantry/pantry.yaml`, schema 2: one `{ have, to_buy }` entry per non-staple ingredient. */
export const pantryFileSchema = z.looseObject({
  updated: optionalString,
  items: z.record(
    z.string(),
    z
      .looseObject({
        have: z.boolean().nullish(),
        to_buy: z.boolean().nullish(),
      })
      .nullish(),
  ),
});

/** The pantry as the app uses it: ids at home and ids on the shopping list, derived from the file's `items`. */
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

/** Meals of the plan the app shows and edits; `snack` meals in the file are kept but never shown (ADR 003). */
export const PLAN_MEALS = ["breakfast", "lunch", "dinner"] as const;
export type PlanMeal = (typeof PLAN_MEALS)[number];

const planDishSchema = z.object({ recipe: z.string().optional(), text: z.string().optional() });
/** The plan as the snapshot carries it: days from yesterday on, each a list of meals with their dishes. */
export const planSchema = z.object({
  updated: z.string().optional(),
  days: z.record(
    z.string(),
    z.array(
      z.object({
        slot: z.string(),
        dishes: z.array(planDishSchema),
      }),
    ),
  ),
});
export type Plan = z.infer<typeof planSchema>;
export type PlanDish = Plan["days"][string][number]["dishes"][number];

export const PANTRY_OP_KINDS = ["pantry.setHave", "pantry.setBuy"] as const;
export type PantryOpKind = (typeof PANTRY_OP_KINDS)[number];

/** One change to the pantry, as the app sends it. */
export interface PantryOp {
  id: string;
  kind: PantryOpKind;
  ingredient: string;
  value: boolean;
}

export const PLAN_OP_KINDS = ["plan.addRecipe", "plan.removeRecipe"] as const;
export type PlanOpKind = (typeof PLAN_OP_KINDS)[number];

/** One change to the plan, as the app sends it. `date` is `YYYY-MM-DD`. */
export interface PlanOp {
  id: string;
  kind: PlanOpKind;
  date: string;
  meal: PlanMeal;
  recipe: string;
}

/** Request body of POST /api/ops. Kind and fields are checked per operation so one bad op never rejects the batch. */
export const opsRequestSchema = z.object({
  ops: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        kind: z.string(),
        ingredient: z.string().optional(),
        value: z.unknown().optional(),
        date: z.string().optional(),
        meal: z.string().optional(),
        recipe: z.string().optional(),
      }),
    )
    .min(1)
    .max(100),
});
export type OpsRequest = z.infer<typeof opsRequestSchema>;

export const opResultSchema = z.object({
  id: z.string(),
  status: z.enum(["applied", "unchanged", "rejected"]),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
});
export type OpResult = z.infer<typeof opResultSchema>;

export const opsResponseSchema = z.object({
  results: z.array(opResultSchema),
  /** Present when the batch had pantry operations. */
  pantry: z
    .object({
      updated: z.string().optional(),
      have: z.array(z.string()),
      to_buy: z.array(z.string()),
    })
    .optional(),
  /** Present when the batch had plan operations. */
  plan: planSchema.optional(),
});
export type OpsResponse = z.infer<typeof opsResponseSchema>;

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
  /** Absent when `plan/plan.yaml` does not exist (the Plan then shows its unavailable state). */
  plan: planSchema.optional(),
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
  "recipes" | "ingredients" | "pantry" | "reviews" | "plan"
> & {
  plan?: Plan;
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
