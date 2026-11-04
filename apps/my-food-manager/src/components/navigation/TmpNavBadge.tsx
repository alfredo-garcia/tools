import { badgeText } from "@/lib/domain/navigation";

/** TEMP: count over a navigation icon; hidden from assistive tech, the item's name carries the number. */
export function TmpNavBadge({ count }: { count: number }) {
  return (
    <span
      aria-hidden
      className="absolute -top-1.5 left-3.5 h-[18px] min-w-[18px] rounded-full bg-primary-500 px-[5px] text-center text-[11px] leading-[18px] font-extrabold text-primary-contrast ring-2 ring-surface-1"
    >
      {badgeText(count)}
    </span>
  );
}
