import { Dumbbell } from "lucide-react";
import { regionTint } from "@/components/common/tint";

type Point = [number, number];
type Pose = { head?: Point; base?: Point[]; move?: Point[]; band?: Point[] };
export type Figure = { start?: Pose; end?: Pose };

type Props = {
  figure?: Figure | null;
  pose: "start" | "end";
  region?: string | null;
  size: "sm";
};

const isPoint = (p: unknown): p is Point =>
  Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number");
const points = (list: unknown) =>
  Array.isArray(list) && list.every(isPoint) && list.length > 1
    ? list.map(([x, y]) => `${x},${y}`).join(" ")
    : null;

/**
 * Kit `ExerciseFigure` (size `sm`, one pose): the stick figure of schema.md (viewBox 170×90) over
 * the region tint; without a usable figure, the tint and `Dumbbell`. Decorative.
 */
export function ExerciseFigure({ figure, pose, region }: Props) {
  const p = figure?.[pose];
  const base = points(p?.base);
  const move = points(p?.move);
  const band = points(p?.band);
  const head = isPoint(p?.head) ? p.head : null;
  const drawable = Boolean(base || move);
  return (
    <span
      aria-hidden
      style={regionTint(region)}
      className="grid h-10 w-18 flex-none place-items-center overflow-hidden rounded-sm text-text-muted"
    >
      {drawable ? (
        <svg viewBox="0 0 170 90" className="h-9 w-17" fill="none" strokeLinecap="round">
          {base && (
            <polyline points={base} className="stroke-(--color-figure-base)" strokeWidth={7} />
          )}
          {move && (
            <polyline
              points={move}
              className="stroke-(--color-figure-move)"
              strokeWidth={7}
              strokeLinejoin="round"
            />
          )}
          {band && (
            <polyline
              points={band}
              className="stroke-(--color-figure-band)"
              strokeWidth={3}
              strokeDasharray="6 5"
            />
          )}
          {head && (
            <circle cx={head[0]} cy={head[1]} r={10} className="fill-(--color-figure-base)" />
          )}
        </svg>
      ) : (
        <Dumbbell className="size-(--icon-md)" />
      )}
    </span>
  );
}
