import { ChevronRight } from "lucide-react";
import { RecipeLink } from "@/components/recipes/RecipeLink";
import { MISSING, groupIngredients, groupTitle, ingredientView } from "@/lib/domain/recipe-detail";
import type { Library, Recipe } from "@/lib/schema";
import { CollapsibleSection } from "./CollapsibleSection";

function Line({ line, library }: { line: Recipe["ingredients"][number]; library: Library }) {
  const v = ingredientView(line, library);
  return (
    <li className="flex items-baseline gap-2 border-b border-border py-2 last:border-b-0">
      <span className="min-w-[72px] shrink-0 font-bold">
        {v.quantity === MISSING ? <span className="text-text-muted">{MISSING}</span> : v.quantity}
      </span>
      <span>
        {v.linkedRecipeId ? (
          <RecipeLink
            recipeId={v.linkedRecipeId}
            className="inline-flex min-h-8 items-center gap-1 font-semibold text-primary-500 underline underline-offset-4"
          >
            {v.name}
            <ChevronRight aria-hidden className="size-3.5" />
          </RecipeLink>
        ) : (
          v.name
        )}
        {v.detail && <span className="text-sm text-text-muted"> · {v.detail}</span>}
        {v.optional && (
          <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text-muted">
            opcional
          </span>
        )}
      </span>
    </li>
  );
}

export function IngredientsSection({ recipe, library }: { recipe: Recipe; library: Library }) {
  const groups = groupIngredients(recipe.ingredients);
  return (
    <CollapsibleSection title="Ingredientes">
      {groups.length === 0 ? (
        <span className="text-text-muted">{MISSING}</span>
      ) : (
        groups.map(({ group, lines }) => (
          <div key={group ?? "main"}>
            {group && (
              <h3 className="mt-4 mb-1 text-xs font-extrabold tracking-[0.06em] text-text-muted uppercase first:mt-0">
                {groupTitle(group)}
              </h3>
            )}
            <ul>
              {lines.map((line, j) => (
                <Line key={`${line.ing}-${j}`} line={line} library={library} />
              ))}
            </ul>
          </div>
        ))
      )}
    </CollapsibleSection>
  );
}
