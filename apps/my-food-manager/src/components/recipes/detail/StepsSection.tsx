import { MISSING } from "@/lib/domain/recipe-detail";
import type { Recipe } from "@/lib/schema";
import { CollapsibleSection } from "./CollapsibleSection";

export function StepsSection({ recipe }: { recipe: Recipe }) {
  return (
    <CollapsibleSection title="Pasos">
      {recipe.steps.length === 0 ? (
        <span className="text-text-muted">{MISSING}</span>
      ) : (
        <ol>
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 py-2">
              <span
                aria-hidden
                className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary-500/15 text-sm font-extrabold text-primary-500"
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </CollapsibleSection>
  );
}
