"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChefHat,
  PanelLeftClose,
  PanelLeftOpen,
  Refrigerator,
  User,
  type LucideIcon,
} from "lucide-react";
import type { Destination, DestinationId } from "@/lib/domain/navigation";

const ICONS: Record<DestinationId, LucideIcon> = {
  recipes: ChefHat,
  plan: CalendarDays,
  ingredients: Refrigerator,
  profile: User,
};

interface NavProps {
  items: readonly Destination[];
  currentId: DestinationId | null;
}

export function BottomNav({ items, currentId }: NavProps) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface-1 pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => {
        const Icon = ICONS[item.id];
        const current = item.id === currentId;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
              current ? "text-primary-500" : "text-text-muted"
            }`}
          >
            {current && (
              <span
                aria-hidden
                className="absolute inset-x-[30%] top-0 h-[3px] rounded-b-[3px] bg-primary-500"
              />
            )}
            <Icon className="size-6" strokeWidth={current ? 2.6 : 2} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav({
  items,
  currentId,
  expanded,
  onToggle,
}: NavProps & { expanded: boolean; onToggle: () => void }) {
  // Collapsed labels stay in the accessibility tree; they are only hidden visually.
  const label = expanded ? "" : "sr-only";
  const ToggleIcon = expanded ? PanelLeftClose : PanelLeftOpen;
  const toggleLabel = expanded ? "Contraer menú" : "Expandir menú";
  return (
    <nav
      aria-label="Principal"
      className={`sticky top-0 flex h-dvh shrink-0 flex-col gap-1 overflow-hidden border-r border-border bg-surface-1 p-3 transition-[width] duration-200 ease-out motion-reduce:transition-none ${
        expanded ? "w-56" : "w-[72px]"
      }`}
    >
      <div className="flex h-12 items-center gap-3 px-2.5 font-extrabold whitespace-nowrap">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={32}
          height={32}
          unoptimized
          className="size-8 shrink-0 rounded-lg"
        />
        <span className={label}>My Food</span>
      </div>
      {items.map((item) => {
        const Icon = ICONS[item.id];
        const current = item.id === currentId;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex h-12 items-center gap-3 rounded-full px-3 text-sm font-semibold whitespace-nowrap ${
              current
                ? "bg-primary-500/15 text-primary-500"
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="size-6 shrink-0" strokeWidth={current ? 2.6 : 2} aria-hidden />
            <span className={label}>{item.label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={toggleLabel}
        className="flex h-12 items-center gap-3 rounded-full px-3 text-sm font-semibold whitespace-nowrap text-text-muted hover:bg-surface-2 hover:text-text"
      >
        <ToggleIcon className="size-6 shrink-0" aria-hidden />
        <span className={label}>{toggleLabel}</span>
      </button>
    </nav>
  );
}
