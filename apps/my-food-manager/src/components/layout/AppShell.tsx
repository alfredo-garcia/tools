"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { SyncBadge } from "@/components/feedback/SyncBadge";
import { Toast } from "@/components/feedback/Toast";
import { useLibrary } from "@/lib/offline/use-library";

const PULL_THRESHOLD = 70;

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { status, syncedAt, refresh } = useLibrary();
  const [toast, setToast] = useState<string>();
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);

  const manualRefresh = useCallback(async () => {
    const result = await refresh();
    if (result === "failed") {
      setToast("No se pudo sincronizar. Se mantienen los datos guardados.");
      setTimeout(() => setToast(undefined), 4000);
    }
  }, [refresh]);

  // Pull-to-refresh on touch devices: only when the page is scrolled to the top.
  useEffect(() => {
    let startY: number | null = null;
    const onStart = (e: TouchEvent) => {
      // Touches inside the recipe detail layer scroll the detail, not the page behind it.
      const target = e.target as Element | null;
      const inDetail = target?.closest?.("[data-detail-layer]");
      // In the large layout the list scrolls inside its own column, not the page.
      const region = target?.closest?.("[data-scroll-region]");
      const scrollTop = region ? region.scrollTop : window.scrollY;
      startY = scrollTop <= 0 && !inDetail ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = Math.max(0, Math.min(110, e.touches[0].clientY - startY));
      pullRef.current = dy;
      setPull(dy);
    };
    const onEnd = () => {
      if (pullRef.current >= PULL_THRESHOLD) void manualRefresh();
      startY = null;
      pullRef.current = 0;
      setPull(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [manualRefresh]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16">
      <div
        aria-hidden
        className="flex items-center justify-center overflow-hidden text-text-muted transition-[height]"
        style={{ height: pull > 8 ? pull / 2 : 0 }}
      >
        <Loader2 className={`size-5 ${pull >= PULL_THRESHOLD ? "text-primary-500" : ""}`} />
      </div>
      <header className="flex items-center justify-between gap-3 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <div className="mt-1.5">
            <SyncBadge status={status} syncedAt={syncedAt} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void manualRefresh()}
          disabled={status === "syncing"}
          aria-label="Sincronizar ahora"
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-text transition active:scale-95 disabled:opacity-40"
        >
          <RefreshCw
            className={`size-5 ${status === "syncing" ? "animate-spin" : ""}`}
            aria-hidden
          />
        </button>
      </header>
      <main>{children}</main>
      {toast && <Toast message={toast} />}
    </div>
  );
}
