"use client";
/** UX Flow 2.7: storage unavailable; shown once per start and removed after 4 s (PRD §10). */
import { useEffect, useState } from "react";
import { TOAST_MS, Toast } from "@/components/feedback/Toast";
import { useSync } from "@/lib/sync/provider";

export function StorageToast() {
  const { state } = useSync();
  const [phase, setPhase] = useState<"waiting" | "shown" | "done">("waiting");
  const show = !state.storageAvailable && state.phase === "ready";

  useEffect(() => {
    if (!show || phase !== "waiting") return;
    const start = setTimeout(() => setPhase("shown"), 0);
    return () => clearTimeout(start);
  }, [show, phase]);

  useEffect(() => {
    if (phase !== "shown") return;
    const end = setTimeout(() => setPhase("done"), TOAST_MS);
    return () => clearTimeout(end);
  }, [phase]);

  if (phase !== "shown") return null;
  return (
    <Toast
      message="No se pueden guardar los datos en este dispositivo; sin conexión no funcionará."
      data-testid="storage-toast"
    />
  );
}
