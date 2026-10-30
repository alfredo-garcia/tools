"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TmpPendingChanges } from "@/components/feedback/TmpPendingChanges";
import { Toast } from "@/components/feedback/Toast";
import { Button } from "@/components/inputs/Button";
import { AppShell } from "@/components/layout/AppShell";
import { useLayout } from "@/components/layout/use-layout";
import { KeyDialog } from "@/components/pantry/KeyDialog";
import { RecipeDetail } from "@/components/recipes/detail/RecipeDetail";
import { MissingIngredientsSheet } from "./MissingIngredientsSheet";
import { PlanDayList } from "./PlanDayList";
import type { PlanActions } from "./PlanSlot";
import { PlanWeek } from "./PlanWeek";
import { RecipePickerSheet } from "./RecipePickerSheet";
import { pantryWithPending } from "@/lib/domain/pantry-view";
import { INITIAL_DAYS, MORE_DAYS, localDate } from "@/lib/domain/plan-calendar";
import { PLAN_MEAL_LABELS, missingIngredients, planWithPending } from "@/lib/domain/plan-view";
import { getOutbox } from "@/lib/offline/outbox-client";
import { useLibrary } from "@/lib/offline/use-library";
import { useOutbox } from "@/lib/offline/use-outbox";
import type { PlanMeal } from "@/lib/schema";

const NOTICE_MS = 4000;
const NO_RECIPES: never[] = [];

/** Today as the device sees it; recomputed when the app comes back to the foreground (midnight may have passed). */
function useToday(): string | undefined {
  const [today, setToday] = useState<string>();
  useEffect(() => {
    const update = () => setToday(localDate(new Date()));
    update();
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, []);
  return today;
}

/** Plan section: the household's meal calendar from today on, edited slot by slot. */
export function PlanScreen() {
  const { hydrated, library, status, storageOk, refresh } = useLibrary();
  const outbox = useOutbox();
  const layout = useLayout();
  const today = useToday();
  const small = layout === "small";

  const [days, setDays] = useState(INITIAL_DAYS);
  const [weekOffset, setWeekOffset] = useState(0);
  const [picker, setPicker] = useState<{ date: string; meal: PlanMeal } | null>(null);
  const [missing, setMissing] = useState<{ recipe: string; ingredients: string[] } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyDismissed, setKeyDismissed] = useState(false);
  const [rejectionClosed, setRejectionClosed] = useState(false);

  const recipes = library?.recipes ?? NO_RECIPES;
  const recipeMap = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const view = useMemo(
    () => planWithPending(library?.plan, outbox.pending, new Set(recipeMap.keys())),
    [library?.plan, outbox.pending, recipeMap],
  );
  const pantry = useMemo(
    () => (library ? pantryWithPending(library.pantry, outbox.pending) : undefined),
    [library, outbox.pending],
  );

  const notice = outbox.notices.find((n) => !n.favorite);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => getOutbox().dismissNotice(notice.id), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // The key is asked right after any picker or missing-ingredients sheet is closed, never on top of them.
  const sheetOpen = picker !== null || missing !== null;
  const keyDialogOpen = !sheetOpen && (keyOpen || (outbox.keyRejected && !rejectionClosed));
  const wantKey = () => {
    if (!outbox.hasKey && !keyDismissed) setKeyOpen(true);
  };
  const closeKey = () => {
    setKeyOpen(false);
    setKeyDismissed(true);
    setRejectionClosed(true);
  };

  const confirmAdd = (recipeId: string) => {
    if (!picker || !library || !pantry) return;
    const recipe = recipeMap.get(recipeId);
    if (!recipe) return;
    const absent = missingIngredients(recipe, library.ingredients, pantry.have);
    void getOutbox().enqueuePlan("plan.addRecipe", picker.date, picker.meal, recipeId);
    const meal = PLAN_MEAL_LABELS.find((m) => m.meal === picker.meal)!;
    setAnnouncement(`${recipe.title} añadida ${meal.to}`);
    setPicker(null);
    if (absent.length > 0) setMissing({ recipe: recipeId, ingredients: absent });
    wantKey();
  };

  const closeMissing = (addToList: boolean) => {
    if (addToList && missing && pantry)
      for (const id of missing.ingredients)
        void getOutbox().enqueue(
          "pantry.setBuy",
          id,
          true,
          library?.pantry.to_buy.includes(id) ?? false,
        );
    if (addToList) setAnnouncement("Ingredientes añadidos a tu lista de la compra");
    setMissing(null);
    wantKey();
  };

  const actions: PlanActions = {
    recipes: recipeMap,
    onAdd: (date, meal) => setPicker({ date, meal }),
    onRemove: (date, meal, recipeId) => {
      void getOutbox().enqueuePlan("plan.removeRecipe", date, meal, recipeId);
      setAnnouncement(`${recipeMap.get(recipeId)?.title ?? "Receta"} quitada`);
      wantKey();
    },
    onOpen: setDetailId,
  };

  let content: React.ReactNode;
  if (!hydrated || !today || (!library && (status === "syncing" || status === "idle"))) {
    content = (
      <div aria-busy="true" aria-label="Cargando el plan">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="mt-3 h-32 animate-pulse rounded-md bg-surface-1 motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  } else if (!library) {
    content = (
      <EmptyState
        emoji={status === "offline" ? "📡" : "⚠️"}
        title={
          status === "offline"
            ? "Necesitas conexión la primera vez"
            : "No se pudo cargar tu biblioteca"
        }
        hint={
          status === "offline"
            ? "Conéctate para descargar tus datos; después funcionarán sin conexión."
            : "Revisa la conexión con Drive e inténtalo de nuevo."
        }
        action={<Button onClick={() => void refresh()}>Reintentar</Button>}
      />
    );
  } else if (!library.plan) {
    content = (
      <EmptyState
        emoji="📅"
        title="El plan todavía no está disponible en Drive"
        hint="Se activará cuando exista el archivo del plan. Tus recetas siguen disponibles."
        action={
          <Button variant="secondary" onClick={() => void refresh()}>
            Reintentar
          </Button>
        }
      />
    );
  } else {
    content = (
      <>
        {outbox.pending.length > 0 && (
          <div className="mb-3">
            <TmpPendingChanges
              count={outbox.pending.length}
              keyNeeded={!outbox.hasKey || outbox.keyRejected}
              onEnterKey={() => setKeyOpen(true)}
            />
          </div>
        )}
        {small ? (
          <PlanDayList
            today={today}
            count={days}
            view={view}
            actions={actions}
            onMore={() => setDays((n) => n + MORE_DAYS)}
          />
        ) : (
          <PlanWeek
            today={today}
            offset={weekOffset}
            view={view}
            actions={actions}
            onOffset={(n) => setWeekOffset(Math.max(0, n))}
          />
        )}
        {(!storageOk || !outbox.storageOk) && (
          <p className="mt-4 text-xs text-warning-500">
            Este navegador no permite guardar datos: los cambios pendientes se perderán si cierras
            la app.
          </p>
        )}
      </>
    );
  }

  const toastMessage = notice?.recipe
    ? `No se pudo guardar ${recipeMap.get(notice.recipe)?.title ?? "la receta"}`
    : notice?.ingredient
      ? `No se pudo guardar ${library?.ingredients[notice.ingredient]?.name ?? notice.ingredient}`
      : undefined;

  return (
    <AppShell title="Plan" wide={!small}>
      {content}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {picker && library && (
        <RecipePickerSheet
          date={picker.date}
          meal={picker.meal}
          recipes={recipes}
          onClose={() => {
            setPicker(null);
            wantKey();
          }}
          onConfirm={confirmAdd}
        />
      )}
      {missing && (
        <MissingIngredientsSheet
          recipeTitle={recipeMap.get(missing.recipe)?.title ?? "Receta"}
          ingredients={missing.ingredients.map((id) => library?.ingredients[id]?.name ?? id)}
          onContinue={() => closeMissing(false)}
          onAddToList={() => closeMissing(true)}
        />
      )}
      {detailId && <RecipeDetail id={detailId} overlay onClose={() => setDetailId(null)} />}
      {keyDialogOpen && (
        <KeyDialog
          rejected={outbox.keyRejected}
          onSave={(key) => {
            setKeyOpen(false);
            setKeyDismissed(false);
            setRejectionClosed(false);
            getOutbox().setKey(key);
          }}
          onClose={closeKey}
        />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </AppShell>
  );
}
