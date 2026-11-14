"use client";
/** UX Flow 002 2.2: detalle de rutina (PRD 002 FR-4 to FR-8). */
import { ListChecks, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MEDIUM_UP, useMediaQuery } from "@/components/common/useMediaQuery";
import { CATEGORY_EMOJI } from "@/components/common/tint";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TOAST_MS, Toast } from "@/components/feedback/Toast";
import { Button } from "@/components/inputs/Button";
import { StickyFooter } from "@/components/layout/StickyFooter";
import { DetailLayer } from "@/components/overlays/DetailLayer";
import { RoutineDetail } from "@/components/routines/RoutineDetail";
import { useSync } from "@/lib/sync/provider";
import { RoutinesList } from "./RoutinesList";
import { routinesUi } from "./routinesUi";

export function RoutineDetailScreen() {
  const router = useRouter();
  const wide = useMediaQuery(MEDIUM_UP);
  const { state } = useSync();
  // undefined: not read yet; null: nothing stored (a direct launch of /routines/detail)
  const [id, setId] = useState<string | null | undefined>(undefined);
  const [toast, setToast] = useState(false);

  // The id lives on the device, not in the URL (FR-8). sessionStorage only exists in the browser,
  // and reading it during render would differ from the prerendered HTML, so it is read after mount.
  useEffect(() => {
    const t = setTimeout(() => setId(routinesUi.selected), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const snapshot = state.snapshot;
  const routine = id ? snapshot?.routines.find((r) => r.id === id) : undefined;
  const exercises = useMemo(
    () => new Map((snapshot?.exercises ?? []).map((e) => [e.id, e])),
    [snapshot],
  );

  const back = useCallback(() => {
    // Opened from the list: history back keeps the browser stack right (and the list's state).
    // Opened directly (reload, launch): the previous entry may be anything, so go to the list.
    const fromList = routinesUi.openedFromList;
    routinesUi.leftDetail();
    if (fromList) router.back();
    else router.replace("/routines");
  }, [router]);

  const ready = snapshot !== null && id !== undefined;
  const content = !ready ? null : routine ? (
    <RoutineDetail
      routine={routine}
      exercises={exercises}
      categories={snapshot.vocabularies.categories}
      resistances={snapshot.vocabularies.resistances}
      emoji={
        snapshot.vocabularies.categories?.[routine.category]
          ? CATEGORY_EMOJI[routine.category]
          : undefined
      }
    />
  ) : (
    <EmptyState
      icon={ListChecks}
      title="Esta rutina ya no está"
      action={
        <Button variant="secondary" onClick={back} data-testid="back-to-list-button">
          Volver a Rutinas
        </Button>
      }
    />
  );

  const footer = routine ? (
    <StickyFooter inDialog={wide}>
      <Button
        variant="primary"
        icon={Play}
        fullWidth
        onClick={() => setToast(true)}
        data-testid="start-routine-button"
      >
        Iniciar rutina
      </Button>
    </StickyFooter>
  ) : null;

  return (
    <>
      {wide && <RoutinesList background />}
      <DetailLayer onBack={back} label={routine?.title ?? "Detalle de rutina"} footer={footer}>
        {content}
      </DetailLayer>
      {toast && <Toast message="El modo guiado llega pronto" data-testid="guided-mode-toast" />}
    </>
  );
}
