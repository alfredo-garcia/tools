/**
 * [fitness-coach/002] Acceptance tests: Mis rutinas (PRD 002, UX Flow 002).
 *
 * - `/api/snapshot` is always mocked (SnapshotApi); synthetic data from fixtures/routines.ts.
 * - Elements are found by the UX Flow names, as `data-testid` (tests/README.md).
 * - Default project: mobile viewport. "Pantalla ancha" blocks switch to 1024 × 720.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { detailSnapshot, longListSnapshot, routinesSnapshot } from "../fixtures/routines";
import {
  H,
  MIN,
  SnapshotApi,
  T0,
  firstSync,
  installFakeNetwork,
  makeSnapshot,
  setOnline,
  setTime,
  toForeground,
} from "./helpers";

const DESKTOP = { viewport: { width: 1024, height: 720 }, isMobile: false, hasTouch: false };

let api: SnapshotApi;

test.beforeEach(async ({ page, context }) => {
  api = await SnapshotApi.install(context);
  await installFakeNetwork(page);
  await setTime(page, T0);
});

const cards = (page: Page) => page.getByTestId("routine-card");
const card = (page: Page, title: string) => cards(page).filter({ hasText: title });
const pausedHeader = (page: Page) => page.getByRole("heading", { name: "Pausadas" });

async function openRoutines(page: Page, snapshot = routinesSnapshot()) {
  await firstSync(page, api, snapshot);
  await page.getByTestId("nav-routines").click();
  await expect(page).toHaveURL(/\/routines$/);
}

async function titles(page: Page) {
  return cards(page).locator("h3").allTextContents();
}

async function openDetail(page: Page, title = "Rutina de detalle", snapshot = detailSnapshot()) {
  await openRoutines(page, snapshot);
  await card(page, title).click();
  await expect(page).toHaveURL(/\/routines\/detail$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

test.describe("[fitness-coach/002] US-1 lista de rutinas", () => {
  test("[fitness-coach/002] AC-1: activas primero y un grupo final «Pausadas» con la etiqueta", async ({
    page,
  }) => {
    await openRoutines(page);
    await expect(cards(page)).toHaveCount(5);
    await expect(pausedHeader(page)).toBeVisible();
    expect(await titles(page)).toEqual([
      "Fuerza de pierna",
      "Natación técnica",
      "Esterilla de core",
      "Express de 10 minutos",
      "Cardio suave en bici",
    ]);
    const paused = card(page, "Cardio suave en bici");
    await expect(paused).toContainText("Pausada");
    for (const t of ["Natación técnica", "Fuerza de pierna", "Esterilla de core"]) {
      await expect(card(page, t)).not.toContainText("Pausada");
    }
    // the paused card comes after the header
    const headerBox = await pausedHeader(page).boundingBox();
    const pausedBox = await paused.boundingBox();
    expect(pausedBox!.y).toBeGreaterThan(headerBox!.y);
  });

  test("[fitness-coach/002] AC-2: la card muestra título, categoría, días, duración y nº de ejercicios", async ({
    page,
  }) => {
    await openRoutines(page);
    const c = card(page, "Fuerza de pierna");
    await expect(c).toContainText("Fuerza de pierna");
    await expect(c).toContainText("Fuerza");
    await expect(c).toContainText("~40 min");
    await expect(c).toContainText("7 ejercicios");
    await expect(c.getByRole("img", { name: "Días: L · J" })).toBeVisible();
  });

  test("[fitness-coach/002] AC-3: sin días ni duración, «Sin día fijo» y sin duración", async ({
    page,
  }) => {
    await openRoutines(page);
    const c = card(page, "Express de 10 minutos");
    await expect(c).toContainText("Sin día fijo");
    await expect(c).not.toContainText(/~\d+ min/);
    await expect(c).toContainText("4 ejercicios");
  });

  test("[fitness-coach/002] AC-4: sin rutinas, estado vacío y ningún filtro", async ({ page }) => {
    await openRoutines(page, makeSnapshot({ activeRoutines: 0, pausedRoutines: 0 }));
    await expect(page.getByText("Todavía no hay rutinas")).toBeVisible();
    await expect(page.getByTestId("day-filter-all")).toHaveCount(0);
    await expect(page.getByTestId("type-filter-all")).toHaveCount(0);
    await expect(cards(page)).toHaveCount(0);
  });

  test("[fitness-coach/002] AC-5: sin red y con copia, la lista sale de la copia con «Sin conexión»", async ({
    page,
  }) => {
    await firstSync(page, api, routinesSnapshot());
    await setTime(page, T0 + 2 * H);
    await setOnline(page, api, false);
    await page.goto("/routines");
    await expect(cards(page)).toHaveCount(5);
    await expect(page.getByTestId("sync-badge")).toContainText("Sin conexión · datos de hace 2 h");
  });
});

test.describe("[fitness-coach/002] US-2 filtros", () => {
  test("[fitness-coach/002] AC-6: el día «L» deja solo las rutinas de lunes, también en «Pausadas»", async ({
    page,
  }) => {
    await openRoutines(page);
    await page.getByTestId("day-filter-mon").click();
    await expect(page.getByTestId("day-filter-mon")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => titles(page)).toEqual(["Fuerza de pierna", "Natación técnica"]);
    await expect(pausedHeader(page)).toHaveCount(0);

    await page.getByTestId("day-filter-tue").click();
    await expect.poll(() => titles(page)).toEqual(["Esterilla de core", "Cardio suave en bici"]);
    await expect(pausedHeader(page)).toBeVisible();
  });

  test("[fitness-coach/002] AC-7: día «L» y tipo «Fuerza» se combinan", async ({ page }) => {
    await openRoutines(page);
    await page.getByTestId("day-filter-mon").click();
    await page.getByTestId("type-filter-strength").click();
    await expect.poll(() => titles(page)).toEqual(["Fuerza de pierna"]);
    // only the categories some routine has are offered
    await expect(page.getByTestId(/^type-filter-/)).toHaveCount(6);
  });

  test("[fitness-coach/002] AC-8: filtros sin resultado y «Quitar filtros»", async ({ page }) => {
    await openRoutines(page);
    await page.getByTestId("day-filter-sun").click();
    await expect(page.getByText("Ninguna rutina con estos filtros")).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await page.getByTestId("clear-filters-button").click();
    await expect(cards(page)).toHaveCount(5);
    await expect(page.getByTestId("day-filter-all")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("type-filter-all")).toHaveAttribute("aria-pressed", "true");
  });

  test("[fitness-coach/002] AC-9: los filtros siguen al volver del detalle", async ({ page }) => {
    await openRoutines(page);
    await page.getByTestId("day-filter-mon").click();
    await page.getByTestId("type-filter-strength").click();
    await card(page, "Fuerza de pierna").click();
    await expect(page).toHaveURL(/\/routines\/detail$/);
    await page.getByTestId("back-button").click();
    await expect(page).toHaveURL(/\/routines$/);
    await expect(page.getByTestId("day-filter-mon")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("type-filter-strength")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => titles(page)).toEqual(["Fuerza de pierna"]);
  });
});

test.describe("[fitness-coach/002] US-3 detalle", () => {
  test("[fitness-coach/002] AC-10: cabecera y bloques en orden con nombre, nota y duración", async ({
    page,
  }) => {
    await openDetail(page);
    await expect(page.getByText("~40 min")).toBeVisible();
    await expect(page.getByRole("img", { name: "Días: L · J" })).toBeVisible();
    const warm = page.getByTestId("block-section-warm-up");
    await expect(warm).toContainText("Calentamiento");
    await expect(warm).toContainText("Sin prisa.");
    await expect(warm).toContainText("8 min");
    const blocks = page.getByTestId(/^block-section-/);
    await expect(blocks).toHaveCount(2);
    await expect(blocks.nth(0)).toHaveAttribute("data-testid", "block-section-warm-up");
    // a block without label shows its id
    await expect(blocks.nth(1)).toContainText("strength");
  });

  test("[fitness-coach/002] AC-11: formatos de dosis junto al título del ejercicio", async ({
    page,
  }) => {
    await openDetail(page);
    const rows = page.getByTestId("exercise-row");
    await expect(rows.filter({ hasText: "Sentadilla a caja" })).toContainText("3 × 12");
    await expect(rows.filter({ hasText: "Movilidad de cadera" })).toContainText("2 × 30 s");
    await expect(rows.filter({ hasText: "Plancha" }).first()).toContainText("aguantar 20 s");
    await expect(rows.filter({ hasText: "Bici estática" })).toContainText("10 min");
  });

  test("[fitness-coach/002] AC-12: variante y resistencia con su etiqueta; desconocidas, tal cual", async ({
    page,
  }) => {
    await openDetail(page);
    const rows = page.getByTestId("exercise-row").filter({ hasText: "Patada de glúteo" });
    await expect(rows.nth(0)).toContainText("Rodillas · banda verde");
    await expect(rows.nth(1)).toContainText("inventada · morada");
  });

  test("[fitness-coach/002] AC-13: ejercicio que no existe, con su id y el aviso", async ({
    page,
  }) => {
    await openDetail(page);
    const missing = page.getByTestId("exercise-row").filter({ hasText: "plancha-lateral" });
    await expect(missing).toContainText("Ejercicio no encontrado");
    await expect(missing).toContainText("2 × 30 s");
    await expect(page.getByTestId("exercise-row")).toHaveCount(7);
  });

  test("[fitness-coach/002] AC-14: «Pautas» y «Progresión» si existen, plegadas", async ({
    page,
  }) => {
    await openDetail(page);
    const guidelines = page.getByTestId("guidelines-section");
    await expect(guidelines).toContainText("Pautas");
    await expect(page.getByTestId("progression-section")).toContainText("Progresión");
    await expect(page.getByText("Pauta inventada.")).not.toBeVisible();
    await guidelines.getByRole("button", { name: "Pautas" }).click();
    await expect(page.getByText("Pauta inventada.")).toBeVisible();
  });

  test("[fitness-coach/002] AC-14: sin secciones, no aparecen", async ({ page }) => {
    await openDetail(page, "Rutina de detalle", detailSnapshot({ sections: false }));
    await expect(page.getByTestId("guidelines-section")).toHaveCount(0);
    await expect(page.getByTestId("progression-section")).toHaveCount(0);
  });

  test("[fitness-coach/002] AC-15: atrás vuelve a la lista en la misma posición de scroll", async ({
    page,
  }) => {
    await openRoutines(page, longListSnapshot());
    const target = card(page, "Rutina de relleno 12");
    await target.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(200);
    await target.click();
    await expect(page).toHaveURL(/\/routines\/detail$/);

    await page.goBack(); // browser back
    await expect(page).toHaveURL(/\/routines$/);
    await expect(target).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 40);

    await target.click();
    await page.getByTestId("back-button").click(); // screen back
    await expect(page).toHaveURL(/\/routines$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 40);
  });

  test("[fitness-coach/002] AC-16: si una actualización quita la rutina abierta, «Esta rutina ya no está»", async ({
    page,
  }) => {
    await openDetail(page);
    const without = routinesSnapshot(); // same data without «Rutina de detalle»
    api.respondOk(without, '"etag-2"');
    await setTime(page, T0 + 2 * MIN); // FR-6b of 001: only after more than 1 min
    await toForeground(page);
    await expect(page.getByText("Esta rutina ya no está")).toBeVisible();
    await expect(page.getByTestId("start-routine-button")).toHaveCount(0);
    await page.getByTestId("back-to-list-button").click();
    await expect(page).toHaveURL(/\/routines$/);
    await expect(cards(page)).toHaveCount(5);
  });
});

test.describe("[fitness-coach/002] US-4 iniciar", () => {
  test("[fitness-coach/002] AC-17: el pie «Iniciar rutina» sigue fijo al hacer scroll, también en pausadas", async ({
    page,
  }) => {
    await openDetail(page, "Rutina de detalle", detailSnapshot({ extraBlocks: 12 }));
    const start = page.getByTestId("start-routine-button");
    await expect(start).toBeInViewport();
    await page.getByTestId("block-section-extra-12").scrollIntoViewIfNeeded();
    await expect(start).toBeInViewport();

    await page.getByTestId("back-button").click();
    await card(page, "Cardio suave en bici").click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Cardio suave en bici" }),
    ).toBeVisible();
    await expect(page.getByText("Pausada")).toBeVisible();
    await expect(page.getByTestId("start-routine-button")).toBeInViewport();
  });

  test("[fitness-coach/002] AC-18: «Iniciar rutina» avisa de que el modo guiado llega pronto", async ({
    page,
  }) => {
    await openDetail(page);
    await page.getByTestId("start-routine-button").click();
    const toast = page.getByTestId("guided-mode-toast");
    await expect(toast).toHaveText("El modo guiado llega pronto");
    await expect(toast).toHaveAttribute("role", "status");
    await expect(page).toHaveURL(/\/routines\/detail$/);
    await expect(page.getByRole("heading", { level: 1, name: "Rutina de detalle" })).toBeVisible();
  });

  test("[fitness-coach/002] AC-19: la URL del detalle no lleva ni el id ni el título", async ({
    page,
  }) => {
    await openDetail(page);
    const url = page.url();
    expect(url).not.toContain("detalle");
    expect(url).not.toMatch(/[?#]/);
    expect(decodeURIComponent(url)).not.toContain("Rutina de detalle");
    expect(new URL(url).pathname).toBe("/routines/detail");
  });
});

test.describe("[fitness-coach/002] pantalla ancha", () => {
  test.use(DESKTOP);

  test("[fitness-coach/002] UX Flow 2.2: desde 640 px el detalle es un modal sobre la lista", async ({
    page,
  }) => {
    await openDetail(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(720);
    await page.getByTestId("back-button").click();
    await expect(page).toHaveURL(/\/routines$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("[fitness-coach/002] revisión independiente", () => {
  test("[fitness-coach/002] FR-4: abrir el detalle sin rutina guardada muestra «Esta rutina ya no está» y vuelve a la lista", async ({
    page,
  }) => {
    await firstSync(page, api, routinesSnapshot());
    await page.goto("/routines/detail"); // direct launch: nothing stored for this tab
    await expect(page.getByText("Esta rutina ya no está")).toBeVisible();
    await page.getByTestId("back-to-list-button").click();
    await expect(page).toHaveURL(/\/routines$/);
  });

  test("[fitness-coach/002] FR-4: tras recargar el detalle, «Atrás» lleva a Rutinas", async ({
    page,
  }) => {
    await openDetail(page);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Rutina de detalle" })).toBeVisible();
    await page.getByTestId("back-button").click();
    await expect(page).toHaveURL(/\/routines$/);
  });

  test.describe("pantalla ancha", () => {
    test.use(DESKTOP);

    test("[fitness-coach/002] AC-15 (≥ 640 px): al cerrar el modal, la lista sigue en la misma posición", async ({
      page,
    }) => {
      await openRoutines(page, longListSnapshot(24));
      const target = card(page, "Rutina de relleno 22");
      await target.scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => window.scrollY);
      expect(before).toBeGreaterThan(200);
      await target.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByTestId("back-button").click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 40);
    });

    test("[fitness-coach/002] UX Flow 2.2: con el modal abierto, la lista de detrás no recibe el foco", async ({
      page,
    }) => {
      await openDetail(page);
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]'),
        );
        expect(inside).toBe(true);
      }
    });
  });

  test.describe("sin conexión con service worker", () => {
    test.use({ serviceWorkers: "allow" });

    test("[fitness-coach/002] FR-8: el detalle abre sin conexión desde la caché", async ({
      page,
      context,
    }) => {
      await firstSync(page, api, detailSnapshot());
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.reload(); // the service worker controls the page and has the shells cached
      await page.getByTestId("nav-routines").click();
      await card(page, "Rutina de detalle").click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Rutina de detalle" }),
      ).toBeVisible();

      await goOffline(context);
      await page.reload();
      await expect(
        page.getByRole("heading", { level: 1, name: "Rutina de detalle" }),
      ).toBeVisible();
      await expect(page.getByTestId("start-routine-button")).toBeVisible();
    });
  });
});

async function goOffline(context: BrowserContext) {
  await context.setOffline(true);
  api.offline = true;
}
