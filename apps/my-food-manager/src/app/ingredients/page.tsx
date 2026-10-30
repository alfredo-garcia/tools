import type { Metadata } from "next";
import { IngredientsScreen } from "@/components/pantry/IngredientsScreen";

export const metadata: Metadata = { title: "Despensa" };

export default function Page() {
  return <IngredientsScreen />;
}
