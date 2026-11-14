import { formatDose, type DoseItem } from "@/lib/domain/routines";

type Props = {
  item: DoseItem;
  /** For `laterality` ("por lado"); absent when the exercise does not exist. */
  exercise?: { laterality?: string | null } | null;
  /** The routine's default rest, used when the item has none. */
  routineRest?: number | null;
};

/** Kit `DoseLabel`: compact dose text ("3 × 12 · descanso 60 s"), tabular numbers. */
export function DoseLabel({ item, exercise, routineRest }: Props) {
  const text = formatDose(item, routineRest, exercise?.laterality);
  if (!text) return null;
  return <span className="text-label tabular-nums">{text}</span>;
}
