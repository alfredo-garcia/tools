import { CalendarPlus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/inputs/Button";

/** The two contextual actions of a recipe: its ingredients to the shopping list, and the recipe to the Plan. */
export function DetailShortcuts({
  onShopping,
  onPlan,
}: {
  onShopping: () => void;
  onPlan: () => void;
}) {
  return (
    <>
      <Button
        variant="secondary"
        icon={ShoppingCart}
        className="w-full sm:w-auto"
        onClick={onShopping}
      >
        Añadir a lista de compra
      </Button>
      <Button variant="secondary" icon={CalendarPlus} className="w-full sm:w-auto" onClick={onPlan}>
        Añadir al plan
      </Button>
    </>
  );
}
