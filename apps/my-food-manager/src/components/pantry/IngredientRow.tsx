import { TmpSwitch } from "@/components/inputs/TmpSwitch";
import type { IngredientItem } from "@/lib/domain/pantry-view";

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** One ingredient with its switches: "Tengo" and "Comprar" in Despensa, only "Comprar" in Lista de compra. */
export function IngredientRow({
  item,
  tab,
  atHome,
  toBuy,
  struck,
  onFlip,
}: {
  item: IngredientItem;
  tab: "despensa" | "lista";
  atHome: boolean;
  toBuy: boolean;
  struck: boolean;
  onFlip: (id: string, kind: "pantry.setHave" | "pantry.setBuy") => void;
}) {
  return (
    <li className="flex min-h-16 items-center gap-2 border-b border-border py-1.5">
      <span
        className={`min-w-0 flex-1 font-semibold ${struck ? "text-text-muted line-through" : ""}`}
      >
        {cap(item.name)}
        {tab === "despensa" && item.staple && (
          <small className="block text-xs font-normal text-text-muted no-underline">
            Básico, siempre disponible
          </small>
        )}
      </span>
      {tab === "despensa" && (
        <TmpSwitch
          label="Tengo"
          tone="success"
          checked={atHome}
          disabled={item.staple}
          ariaLabel={`Tengo ${item.name}`}
          onChange={() => onFlip(item.id, "pantry.setHave")}
        />
      )}
      <TmpSwitch
        label="Comprar"
        tone="primary"
        checked={toBuy}
        ariaLabel={`Comprar ${item.name}`}
        onChange={() => onFlip(item.id, "pantry.setBuy")}
      />
    </li>
  );
}
