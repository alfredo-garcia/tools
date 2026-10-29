import type { Layout } from "@/lib/domain/layout";

export type DestinationId = "recipes" | "plan" | "ingredients" | "profile";

export interface Destination {
  id: DestinationId;
  href: string;
  label: string;
}

export const DESTINATIONS: readonly Destination[] = [
  { id: "recipes", href: "/", label: "Recetas" },
  { id: "plan", href: "/plan", label: "Plan" },
  { id: "ingredients", href: "/ingredients", label: "Despensa" },
  { id: "profile", href: "/profile", label: "Perfil" },
];

/** The destination an address belongs to; the recipe detail belongs to Recetas. */
export function currentDestination(pathname: string): DestinationId | null {
  if (pathname === "/" || pathname.startsWith("/recipes/")) return "recipes";
  const match = DESTINATIONS.find(
    (d) => d.href !== "/" && (pathname === d.href || pathname.startsWith(`${d.href}/`)),
  );
  return match ? match.id : null;
}

/** A stored choice wins on every size; otherwise only the large layout starts expanded. */
export function sidebarExpanded(stored: boolean | null, layout: Layout): boolean {
  return stored ?? layout === "large";
}

/** The recipe detail covers the whole window on small ones, so the bottom bar steps aside. */
export function showBottomNav(layout: Layout, pathname: string): boolean {
  return layout === "small" && !pathname.startsWith("/recipes/");
}
