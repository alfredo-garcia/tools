"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/inputs/Button";
import { Sheet } from "@/components/overlays/Sheet";
import { IngredientGroups } from "@/components/pantry/IngredientGroups";
import { classifyIngredients } from "@/lib/domain/ingredient-groups";
import { pantryWithPending } from "@/lib/domain/pantry-view";
import { FAVORITE_TOGGLED } from "@/lib/offline/use-favorites";
import { useOutbox } from "@/lib/offline/use-outbox";
import { addToShoppingList } from "@/lib/offline/shopping-list";
import type { Library, Recipe } from "@/lib/schema";

/** "Añadir a lista de compra" from the detail: where each ingredient stands, and the Faltan ones to the list. */
export function ShoppingListSheet({
  recipe,
  library,
  onClose,
}: {
  recipe: Recipe;
  library: Library;
  onClose: () => void;
}) {
  const { pending } = useOutbox();
  const groups = useMemo(() => {
    const view = pantryWithPending(library.pantry, pending);
    return classifyIngredients(recipe, library.ingredients, view.have, view.buy);
  }, [recipe, library, pending]);

  const add = () => {
    addToShoppingList(groups.faltan, library.pantry.to_buy);
    onClose();
    // Asks for the write key once the sheet is gone, as the other changes do.
    window.dispatchEvent(new Event(FAVORITE_TOGGLED));
  };

  // In the body, so the detail layer around the button cannot clip or trap it.
  return createPortal(
    <Sheet open back onClose={onClose} title={recipe.title} subtitle="Lista de compra">
      <div className="min-h-0 overflow-y-auto">
        <IngredientGroups groups={groups} names={(id) => library.ingredients[id]?.name ?? id} />
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="secondary" className="sm:flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="sm:flex-1" disabled={groups.faltan.length === 0} onClick={add}>
          Añadir a la lista
        </Button>
      </div>
    </Sheet>,
    document.body,
  );
}
