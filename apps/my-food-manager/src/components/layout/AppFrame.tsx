"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { FavoriteFeedback } from "@/components/feedback/FavoriteFeedback";
import { BottomNav, SideNav } from "@/components/navigation/Nav";
import { useLayout } from "@/components/layout/use-layout";
import { useSidebarPreference } from "@/components/layout/use-sidebar-preference";
import {
  DESTINATIONS,
  currentDestination,
  showBottomNav,
  sidebarExpanded,
} from "@/lib/domain/navigation";
import { buyCount, catalogItems, pantryWithPending } from "@/lib/domain/pantry-view";
import { useLibrary } from "@/lib/offline/use-library";
import { useOutbox } from "@/lib/offline/use-outbox";

/** Main navigation around every screen: bottom bar on small windows, collapsible sidebar from 640 px. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const layout = useLayout();
  const [stored, setStored] = useSidebarPreference();
  const currentId = currentDestination(pathname);
  const expanded = sidebarExpanded(stored, layout);
  const bottom = showBottomNav(layout, pathname);
  const { library } = useLibrary();
  const { pending } = useOutbox();
  const toBuy = useMemo(
    () =>
      library
        ? buyCount(catalogItems(library.ingredients), pantryWithPending(library.pantry, pending))
        : 0,
    [library, pending],
  );
  const badges = { shopping: toBuy };

  return (
    <div className="flex">
      {layout !== "small" && (
        <SideNav
          items={DESTINATIONS}
          currentId={currentId}
          badges={badges}
          expanded={expanded}
          onToggle={() => setStored(!expanded)}
        />
      )}
      <div
        className={`min-w-0 flex-1 ${bottom ? "pb-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}
      >
        {children}
      </div>
      {bottom && <BottomNav items={DESTINATIONS} currentId={currentId} badges={badges} />}
      <FavoriteFeedback />
    </div>
  );
}
