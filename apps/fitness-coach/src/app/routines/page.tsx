"use client";
/** UX Flow 2.4: Rutinas, provisional until #3. */
import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Screen } from "../_screens/Screen";

export default function RoutinesPage() {
  return (
    <Screen current="routines" title="Rutinas">
      <EmptyState icon={ListChecks} title="Próximamente" text="Aquí verás tus rutinas." />
    </Screen>
  );
}
