import type { Library, Recipe } from "@/lib/schema";

export interface IngredientGroups {
  /** Not at home and not on the shopping list. */
  faltan: string[];
  /** Not at home and already on the shopping list. */
  lista: string[];
  /** At home (`have` on, even if also on the list) or a staple. */
  tengo: string[];
}

/**
 * Sorts the catalog ingredients of a recipe, each once and in recipe order (optional lines included), into
 * Faltan, En mi lista de la compra and Ya tengo. Ingredients outside the catalog have no switches and are left out.
 */
export function classifyIngredients(
  recipe: Pick<Recipe, "ingredients">,
  catalog: Library["ingredients"],
  have: ReadonlySet<string>,
  buy: ReadonlySet<string>,
): IngredientGroups {
  const groups: IngredientGroups = { faltan: [], lista: [], tengo: [] };
  const seen = new Set<string>();
  for (const line of recipe.ingredients) {
    const entry = catalog[line.ing];
    if (!entry || seen.has(line.ing)) continue;
    seen.add(line.ing);
    if (entry.staple || have.has(line.ing)) groups.tengo.push(line.ing);
    else if (buy.has(line.ing)) groups.lista.push(line.ing);
    else groups.faltan.push(line.ing);
  }
  return groups;
}

export const hasIngredients = (g: IngredientGroups) =>
  g.faltan.length + g.lista.length + g.tengo.length > 0;
