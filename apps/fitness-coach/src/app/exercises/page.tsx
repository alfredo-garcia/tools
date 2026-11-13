"use client";
/** UX Flow 2.5: Ejercicios, provisional until #4. */
import { Dumbbell } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Screen } from "../_screens/Screen";

export default function ExercisesPage() {
  return (
    <Screen current="exercises" title="Ejercicios">
      <EmptyState icon={Dumbbell} title="Próximamente" text="Aquí verás tus ejercicios." />
    </Screen>
  );
}
