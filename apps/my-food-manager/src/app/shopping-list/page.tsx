import type { Metadata } from "next";
import { IngredientsScreen } from "@/components/pantry/IngredientsScreen";

export const metadata: Metadata = { title: "Lista de compra" };

export default function Page() {
  return <IngredientsScreen tab="lista" />;
}
