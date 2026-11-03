"use client";

import { Button } from "@/components/inputs/Button";
import { Sheet } from "@/components/overlays/Sheet";
import { IngredientGroups } from "@/components/pantry/IngredientGroups";
import type { IngredientGroups as Groups } from "@/lib/domain/ingredient-groups";

/**
 * Tells where each ingredient of the recipe just planned stands (Faltan, En mi lista de la compra, Ya tengo). Closing it
 * any other way (Esc, backdrop) is the same as "Continuar": the shopping list stays as it is.
 */
export function MissingIngredientsSheet({
  recipeTitle,
  groups,
  names,
  onContinue,
  onAddToList,
}: {
  recipeTitle: string;
  groups: Groups;
  names: (id: string) => string;
  onContinue: () => void;
  onAddToList: () => void;
}) {
  return (
    <Sheet open hideClose onClose={onContinue} title={recipeTitle} subtitle="Añadida al plan">
      <p className="mb-3 text-text-muted">En tu despensa te faltan estos ingredientes:</p>
      <div className="min-h-0 overflow-y-auto">
        <IngredientGroups groups={groups} names={names} />
      </div>
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
