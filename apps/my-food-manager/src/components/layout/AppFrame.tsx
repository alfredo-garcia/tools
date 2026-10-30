"use client";

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

/** Main navigation around every screen: bottom bar on small windows, collapsible sidebar from 640 px. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const layout = useLayout();
  const [stored, setStored] = useSidebarPreference();
  const currentId = currentDestination(pathname);
  const expanded = sidebarExpanded(stored, layout);
  const bottom = showBottomNav(layout, pathname);

  return (
    <div className="flex">
      {layout !== "small" && (
        <SideNav
          items={DESTINATIONS}
          currentId={currentId}
          expanded={expanded}
          onToggle={() => setStored(!expanded)}
        />
      )}
      <div
        className={`min-w-0 flex-1 ${bottom ? "pb-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}
      >
        {children}
      </div>
      {bottom && <BottomNav items={DESTINATIONS} currentId={currentId} />}
      <FavoriteFeedback />
    </div>
  );
}
