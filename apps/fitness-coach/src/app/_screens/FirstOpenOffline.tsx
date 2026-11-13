"use client";
/** UX Flow 2.2: first open without network (FR-11, AC-3). */
import { CloudOff } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/inputs/Button";

export function FirstOpenOffline({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center pt-[env(safe-area-inset-top)]">
      <EmptyState
        icon={CloudOff}
        title="Necesitas conexión la primera vez"
        text="Conéctate una vez para descargar tus rutinas; después funciona sin red."
        action={
          <Button variant="secondary" onClick={onRetry} data-testid="retry-button">
            Reintentar
          </Button>
        }
      />
    </main>
  );
}
