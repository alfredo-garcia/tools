"use client";
import { Dumbbell, House, ListChecks, type LucideIcon } from "lucide-react";
import Link from "next/link";

export type Destination = "home" | "routines" | "exercises";

const ITEMS: { id: Destination; href: string; label: string; icon: LucideIcon }[] = [
  { id: "home", href: "/", label: "Inicio", icon: House },
  { id: "routines", href: "/routines", label: "Rutinas", icon: ListChecks },
  { id: "exercises", href: "/exercises", label: "Ejercicios", icon: Dumbbell },
];

type Props = { current: Destination };

/** The "MC" mark of the PWA icon (no logo yet, ui_standards §5). */
export function BrandMark() {
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-bg text-label font-extrabold text-primary-500"
    >
      MC
    </span>
  );
}

/** Kit `BottomNav`: fixed bottom bar below 640 px (ui_standards §9). */
export function BottomNav({ current }: Props) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-1 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {ITEMS.map(({ id, href, label, icon: Icon }) => {
          const active = id === current;
          return (
            <li key={id} className="flex-1">
              <Link
                href={href}
                data-testid={`nav-${id}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-xs text-caption ${active ? "text-primary-500" : "text-text-muted"}`}
              >
                <Icon aria-hidden className="size-(--icon-nav)" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Kit `SideNav`: left bar from 640 px, 224 px with the "MC" mark and "My Coach". */
export function SideNav({ current }: Props) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-y-0 left-0 z-30 flex w-(--size-sidenav-expanded) flex-col gap-lg border-r border-border bg-surface-1 p-md"
    >
      <div className="flex items-center gap-sm px-sm pt-sm">
        <BrandMark />
        <span className="text-heading-2">My Coach</span>
      </div>
      <ul className="flex flex-col gap-xs">
        {ITEMS.map(({ id, href, label, icon: Icon }) => {
          const active = id === current;
          return (
            <li key={id}>
              <Link
                href={href}
                data-testid={`nav-${id}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-(--size-touch-min) items-center gap-md rounded-full px-md text-label ${active ? "bg-primary-500/14 text-text" : "text-text-muted hover:bg-surface-2"}`}
              >
                <Icon
                  aria-hidden
                  className={`size-(--icon-nav) ${active ? "text-primary-500" : ""}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
