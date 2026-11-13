"use client";
import type { ReactNode } from "react";
import { MEDIUM_UP, useMediaQuery } from "@/components/common/useMediaQuery";
import { BottomNav, SideNav, type Destination } from "@/components/navigation/Nav";

type Props = { current: Destination; children: ReactNode };

/**
 * Kit `AppFrame`: puts the navigation around a screen. Only one of the two bars is in the DOM
 * (BottomNav below 640 px, SideNav from 640 px).
 */
export function AppFrame({ current, children }: Props) {
  const wide = useMediaQuery(MEDIUM_UP);
  return (
    <div
      className={
        wide ? "pl-(--size-sidenav-expanded)" : "pb-[calc(64px+env(safe-area-inset-bottom))]"
      }
    >
      {wide ? <SideNav current={current} /> : <BottomNav current={current} />}
      {children}
    </div>
  );
}
