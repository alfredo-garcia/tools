"use client";

import { Button } from "@/components/inputs/Button";
import { Sheet } from "@/components/overlays/Sheet";

/**
 * Tells which ingredients of the recipe just planned are not at home. Closing it any other way
 * (Esc, backdrop) is the same as "Continuar": the shopping list stays as it is.
 */
export function MissingIngredientsSheet({
  recipeTitle,
  ingredients,
  onContinue,
  onAddToList,
}: {
  recipeTitle: string;
  ingredients: string[];
  onContinue: () => void;
  onAddToList: () => void;
}) {
  return (
    <Sheet open hideClose onClose={onContinue} title={recipeTitle} subtitle="Añadida al plan">
      <p className="mb-3 text-text-muted">En tu despensa te faltan estos ingredientes:</p>
      <ul className="min-h-0 overflow-y-auto">
        {ingredients.map((name) => (
          <li
            key={name}
            className="border-b border-border px-1 py-2.5 font-semibold last:border-b-0"
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="secondary" className="sm:flex-1" onClick={onContinue}>
          Continuar
        </Button>
        <Button className="sm:flex-1" onClick={onAddToList}>
          Añadir a mi lista de la compra
        </Button>
      </div>
    </Sheet>
  );
}
