/**
 * [fitness-coach/001] Acceptance tests: offline KB data (PRD 001, UX Flow 001).
 *
 * - `/api/snapshot` is always mocked (SnapshotApi); the Drive is never touched.
 * - Elements are found by the UX Flow names, as `data-testid` (tests/README.md).
 * - Default project: mobile viewport (Pixel 7). "Desktop" blocks switch to 1024 × 720.
 * - AC-17's install on a real phone (icon on the home screen, full screen) is checked by hand;
 *   here only the manifest and icons are verified.
 */
import { expect, test } from "@playwright/test";
import {
  H,
  KEY,
  MIN,
  SnapshotApi,
  T0,
  firstSync,
  installFakeNetwork,
  makeSnapshot,
  pullToRefresh,
  setOnline,
  setTime,
  summaryText,
  toForeground,
} from "./helpers";

const DESKTOP = { viewport: { width: 1024, height: 720 }, isMobile: false, hasTouch: false };

let api: SnapshotApi;

test.beforeEach(async ({ page, context }) => {
  api = await SnapshotApi.install(context);
  await installFakeNetwork(page);
  await setTime(page, T0);
});

const badge = (page: import("@playwright/test").Page) => page.getByTestId("sync-badge");
const summary = (page: import("@playwright/test").Page) => page.getByTestId("summary-card");

test.describe("[fitness-coach/001] US-1 sin conexión", () => {
  test("[fitness-coach/001] AC-1: con copia y sin red, la Home muestra el resumen y «Sin conexión»", async ({
    page,
  }) => {
    await firstSync(page, api, makeSnapshot({ exercises: 29, activeRoutines: 7 }));
    await setTime(page, T0 + 2 * H);
    await setOnline(page, api, false);
    await page.reload();
    await expect(summary(page)).toContainText(summaryText(29, 7));
    await expect(badge(page)).toContainText("Sin conexión · datos de hace 2 h");
    await expect(page.getByTestId("key-input")).toHaveCount(0);
  });

  test.describe("arranque en frío con service worker", () => {
    test.use({ serviceWorkers: "allow" });

    test("[fitness-coach/001] AC-2: cerrada del todo y sin red, la app arranca desde la caché", async ({
      page,
      context,
    }) => {
      await firstSync(page, api);
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.reload(); // the service worker now controls the page and has the shell cached
      await expect(summary(page)).toBeVisible();
      await page.close();

      await context.setOffline(true);
      api.offline = true;
      const cold = await context.newPage();
      await cold.goto("/");
      await expect(cold.getByTestId("summary-card")).toBeVisible();
      await expect(cold.getByTestId("sync-badge")).toContainText("Sin conexión");
    });
  });

  test("[fitness-coach/001] AC-3: primera apertura sin red pide conexión; con red, «Reintentar» lleva a la clave", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // only on the very first load of this tab, so toggling online later survives reloads
      if (!sessionStorage.getItem("__e2e_started")) {
        sessionStorage.setItem("__e2e_started", "1");
        localStorage.setItem("__e2e_offline", "1");
      }
    });
    await page.goto("/");
    await expect(page.getByText("Necesitas conexión la primera vez")).toBeVisible();
    await expect(page.getByTestId("retry-button")).toHaveText("Reintentar");
    await expect(page.getByTestId("key-input")).toHaveCount(0);

    // still offline: stays here
    await page.getByTestId("retry-button").click();
    await expect(page.getByText("Necesitas conexión la primera vez")).toBeVisible();

    await page.evaluate(() => {
      localStorage.setItem("__e2e_offline", "0");
      window.dispatchEvent(new Event("online"));
    });
    await page.getByTestId("retry-button").click();
    await expect(page.getByTestId("key-input")).toBeVisible();
  });
});

test.describe("[fitness-coach/001] US-2 se actualiza sola", () => {
  test("[fitness-coach/001] AC-4: primero la copia guardada, luego los datos nuevos y «hace un momento»", async ({
    page,
  }) => {
    await firstSync(page, api, makeSnapshot({ exercises: 29, activeRoutines: 7 }));
    await setTime(page, T0 + 2 * H);
    api.hold();
    api.respondOk(makeSnapshot({ exercises: 30, activeRoutines: 8 }), '"etag-2"');
    await page.reload();
    await expect(summary(page)).toContainText(summaryText(29, 7)); // FR-5: the copy before the network
    api.release();
    await expect(summary(page)).toContainText(summaryText(30, 8));
    await expect(badge(page)).toContainText("Sincronizado · hace un momento");
  });

  test("[fitness-coach/001] AC-5: al volver a primer plano tras más de 1 min, se actualiza", async ({
    page,
  }) => {
    await firstSync(page, api);
    const before = api.count;
    await setTime(page, T0 + 2 * MIN);
    api.respondOk(makeSnapshot({ exercises: 29, activeRoutines: 6 }), '"etag-2"');
    await toForeground(page);
    await expect(summary(page)).toContainText(summaryText(29, 6));
    expect(api.count).toBe(before + 1);
  });

  test("[fitness-coach/001] AC-5 (FR-6b): al volver a primer plano antes de 1 min, no se actualiza", async ({
    page,
  }) => {
    await firstSync(page, api);
    const before = api.count;
    await setTime(page, T0 + 30_000);
    await toForeground(page);
    await page.waitForTimeout(1000);
    expect(api.count).toBe(before);
  });

  test("[fitness-coach/001] AC-6: al volver la conexión, se actualiza sin hacer nada", async ({
    page,
  }) => {
    await firstSync(page, api);
    await setOnline(page, api, false);
    await expect(badge(page)).toContainText("Sin conexión");
    const before = api.count;
    api.respondOk(makeSnapshot({ exercises: 31, activeRoutines: 7 }), '"etag-2"');
    await setOnline(page, api, true);
    await expect(summary(page)).toContainText(summaryText(31, 7));
    await expect(badge(page)).toContainText("Sincronizado");
    expect(api.count).toBeGreaterThan(before);
  });

  test("[fitness-coach/001] AC-7: tirar para refrescar actualiza aunque sea antes de 1 min y muestra «Sincronizando…»", async ({
    page,
  }) => {
    await firstSync(page, api);
    const before = api.count;
    await setTime(page, T0 + 10_000);
    api.hold();
    await pullToRefresh(page);
    await expect(badge(page)).toContainText("Sincronizando…");
    expect(api.count).toBe(before + 1);
    api.release();
    await expect(badge(page)).toContainText("Sincronizado");
  });

  test("[fitness-coach/001] AC-20: por debajo de 640 px no hay botón «Actualizar»", async ({
    page,
  }) => {
    await firstSync(page, api);
    await expect(page.getByTestId("refresh-button")).toHaveCount(0);
  });

  test.describe("pantalla ancha", () => {
    test.use(DESKTOP);

    test("[fitness-coach/001] AC-20: desde 640 px, «Actualizar» actualiza aunque sea antes de 1 min", async ({
      page,
    }) => {
      await firstSync(page, api);
      const before = api.count;
      await setTime(page, T0 + 10_000);
      api.hold();
      const button = page.getByTestId("refresh-button");
      await expect(button).toHaveAccessibleName("Actualizar");
      await button.click();
      await expect(badge(page)).toContainText("Sincronizando…");
      expect(api.count).toBe(before + 1);
      api.release();
      await expect(badge(page)).toContainText("Sincronizado");
    });
  });

  test("[fitness-coach/001] AC-8: sin cambios en el Drive (304), los datos siguen y la hora pasa a la actual", async ({
    page,
  }) => {
    await firstSync(page, api, makeSnapshot({ exercises: 29, activeRoutines: 7 }));
    await setTime(page, T0 + 10 * MIN);
    api.respond((req) =>
      req.headers["if-none-match"] === '"etag-1"'
        ? { kind: "status", status: 304 }
        : {
            kind: "ok",
            snapshot: makeSnapshot({ exercises: 1, activeRoutines: 1 }),
            etag: '"otro"',
          },
    );
    await toForeground(page);
    await expect(badge(page)).toContainText("Sincronizado · hace un momento");
    await expect(summary(page)).toContainText(summaryText(29, 7));
    expect(api.requests.at(-1)!.headers["if-none-match"]).toBe('"etag-1"');
  });

  test("[fitness-coach/001] AC-9: con una actualización en curso, otros disparadores no lanzan otra", async ({
    page,
  }) => {
    await firstSync(page, api);
    await setTime(page, T0 + 2 * MIN);
    api.hold();
    await toForeground(page);
    await expect(badge(page)).toContainText("Sincronizando…");
    const during = api.count;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await toForeground(page);
    await pullToRefresh(page);
    await page.waitForTimeout(500);
    expect(api.count).toBe(during);
    api.release();
    await expect(badge(page)).toContainText("Sincronizado");
  });
});

test.describe("[fitness-coach/001] US-3 la clave", () => {
  test("[fitness-coach/001] AC-10: clave correcta → Home; la siguiente apertura no la pide", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("enter-button")).toBeDisabled();
    await firstSync(page, api);
    const first = api.requests[0];
    expect(first.headers["x-app-key"]).toBe(KEY);
    expect(first.headers["x-client-format"]).toBe("1");
    expect(first.url).not.toContain(KEY);

    await page.reload();
    await expect(summary(page)).toBeVisible();
    await expect(page.getByTestId("key-input")).toHaveCount(0);
    await expect.poll(() => api.count).toBeGreaterThan(1);
    expect(api.requests.at(-1)!.headers["x-app-key"]).toBe(KEY);
  });

  test("[fitness-coach/001] AC-11: clave incorrecta → «Esa clave no es correcta» y no se guarda nada", async ({
    page,
  }) => {
    api.respondStatus(401);
    await page.goto("/");
    await page.getByTestId("key-input").fill("mala");
    await page.getByTestId("enter-button").click();
    await expect(page.getByTestId("key-error")).toHaveText("Esa clave no es correcta");
    await expect(page.getByTestId("key-input")).toHaveAttribute("aria-invalid", "true");

    await page.reload();
    await expect(page.getByTestId("key-input")).toBeVisible();
    await expect(page.getByTestId("key-input")).toHaveValue("");
  });

  test("[fitness-coach/001] AC-11: el campo de la clave se puede mostrar y ocultar", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByTestId("key-input");
    await expect(input).toHaveAttribute("type", "password");
    await page.getByTestId("key-visibility-toggle").click();
    await expect(input).toHaveAttribute("type", "text");
    await page.getByTestId("key-visibility-toggle").click();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("[fitness-coach/001] AC-12: clave rechazada → datos visibles, «Clave no válida» y sheet; la nueva completa la actualización", async ({
    page,
  }) => {
    await firstSync(page, api, makeSnapshot({ exercises: 29, activeRoutines: 7 }));
    await setTime(page, T0 + 2 * MIN);
    api.respond((req) =>
      req.headers["x-app-key"] === "clave-nueva"
        ? {
            kind: "ok",
            snapshot: makeSnapshot({ exercises: 32, activeRoutines: 7 }),
            etag: '"etag-2"',
          }
        : { kind: "status", status: 401 },
    );
    await page.reload();
    await expect(summary(page)).toContainText(summaryText(29, 7));
    await expect(badge(page)).toContainText("Clave no válida · toca para introducirla");
    await expect(page.getByTestId("key-sheet")).toBeVisible();

    // a wrong key keeps the stored one
    await page.getByTestId("key-sheet-input").fill("mala");
    await page.getByTestId("key-sheet-save").click();
    await expect(page.getByTestId("key-sheet-error")).toHaveText("Esa clave no es correcta");

    // closing leaves the app in invalid_key with the data; the badge reopens the sheet
    await page.getByTestId("key-sheet-close").click();
    await expect(page.getByTestId("key-sheet")).toBeHidden();
    await expect(summary(page)).toContainText(summaryText(29, 7));
    await page.reload();
    await expect.poll(() => api.requests.at(-1)!.headers["x-app-key"]).toBe(KEY);
    await expect(badge(page)).toContainText("Clave no válida");
    await page.getByTestId("key-sheet-close").click();
    await badge(page).click();
    await expect(page.getByTestId("key-sheet")).toBeVisible();

    await page.getByTestId("key-sheet-input").fill("clave-nueva");
    await page.getByTestId("key-sheet-save").click();
    await expect(page.getByTestId("key-sheet")).toBeHidden();
    await expect(summary(page)).toContainText(summaryText(32, 7));
    await expect(badge(page)).toContainText("Sincronizado");

    await page.reload();
    await expect.poll(() => api.requests.at(-1)!.headers["x-app-key"]).toBe("clave-nueva");
  });
});

test.describe("[fitness-coach/001] US-4 estado de los datos", () => {
  const screens = [
    { nav: "nav-home", path: "/" },
    { nav: "nav-routines", path: "/routines" },
    { nav: "nav-exercises", path: "/exercises" },
  ];

  async function expectOnEveryScreen(
    page: import("@playwright/test").Page,
    text: string,
    icon: string,
  ) {
    for (const s of screens) {
      await page.getByTestId(s.nav).click();
      await expect(page).toHaveURL(new RegExp(`${s.path}$`));
      await expect(badge(page)).toContainText(text);
      await expect(badge(page).locator(`svg.lucide-${icon}`)).toHaveCount(1);
    }
  }

  test("[fitness-coach/001] AC-13: sincronizado", async ({ page }) => {
    await firstSync(page, api);
    await expectOnEveryScreen(page, "Sincronizado · hace un momento", "check");
  });

  test("[fitness-coach/001] AC-13: sin conexión", async ({ page }) => {
    await firstSync(page, api);
    await setTime(page, T0 + 2 * H);
    await setOnline(page, api, false);
    await page.reload();
    await expectOnEveryScreen(page, "Sin conexión · datos de hace 2 h", "cloud-off");
  });

  test("[fitness-coach/001] AC-13: sincronizando", async ({ page }) => {
    await firstSync(page, api);
    api.hold();
    await pullToRefresh(page);
    await expectOnEveryScreen(page, "Sincronizando…", "refresh-cw");
    api.release();
  });

  test("[fitness-coach/001] AC-13: error", async ({ page }) => {
    await firstSync(page, api);
    await setTime(page, T0 + 2 * H);
    api.respondStatus(502);
    await page.reload();
    await expectOnEveryScreen(page, "No se pudo actualizar · datos de hace 2 h", "triangle-alert");
  });

  test("[fitness-coach/001] AC-13: clave no válida", async ({ page }) => {
    await firstSync(page, api);
    api.respondStatus(401);
    await page.reload();
    await page.getByTestId("key-sheet-close").click();
    await expectOnEveryScreen(page, "Clave no válida · toca para introducirla", "key-round");
  });

  test("[fitness-coach/001] AC-14: el Drive falla → copia intacta y «No se pudo actualizar»; el siguiente disparador reintenta", async ({
    page,
  }) => {
    await firstSync(page, api, makeSnapshot({ exercises: 29, activeRoutines: 7 }));
    await setTime(page, T0 + 2 * H);
    api.respondStatus(502);
    await toForeground(page);
    await expect(badge(page)).toContainText("No se pudo actualizar · datos de hace 2 h");
    await expect(summary(page)).toContainText(summaryText(29, 7));

    const before = api.count;
    api.respondOk(makeSnapshot({ exercises: 30, activeRoutines: 7 }), '"etag-2"');
    await toForeground(page);
    await expect(summary(page)).toContainText(summaryText(30, 7));
    expect(api.count).toBe(before + 1);
  });

  test("[fitness-coach/001] AC-14: más de 15 s sin respuesta → «No se pudo actualizar», copia intacta", async ({
    page,
  }) => {
    test.slow();
    await firstSync(page, api, makeSnapshot({ exercises: 29, activeRoutines: 7 }));
    await setTime(page, T0 + 2 * H);
    api.respond(() => ({ kind: "hang" }));
    await toForeground(page);
    await expect(badge(page)).toContainText("Sincronizando…");
    await expect(badge(page)).toContainText("No se pudo actualizar", { timeout: 20_000 });
    await expect(summary(page)).toContainText(summaryText(29, 7));
  });
});

test.describe("[fitness-coach/001] US-5 ficheros que no se pueden leer", () => {
  test("[fitness-coach/001] AC-15: el resumen cuenta lo leído y avisa de 1 fichero, sin mostrar cuál", async ({
    page,
  }) => {
    const path = "routines/items/02-strength/rutina-rota.md";
    await firstSync(
      page,
      api,
      makeSnapshot({
        exercises: 29,
        activeRoutines: 6,
        skipped: [{ path, reason: "schema_error" }],
      }),
    );
    await expect(summary(page)).toContainText(summaryText(29, 6));
    await expect(page.getByTestId("skipped-warning")).toHaveText("1 fichero no se pudo leer");
    await expect(page.locator("body")).not.toContainText("rutina-rota");
  });

  test("[fitness-coach/001] AC-15: varios ficheros en plural; ninguno, sin aviso", async ({
    page,
  }) => {
    await firstSync(
      page,
      api,
      makeSnapshot({
        skipped: [
          { path: "a.md", reason: "parse_error" },
          { path: "program/al.yaml", reason: "schema_error" },
        ],
      }),
    );
    await expect(page.getByTestId("skipped-warning")).toHaveText("2 ficheros no se pudieron leer");

    await setTime(page, T0 + 2 * MIN);
    api.respondOk(makeSnapshot({ skipped: [] }), '"etag-2"');
    await toForeground(page);
    await expect(page.getByTestId("skipped-warning")).toHaveCount(0);
  });
});

test.describe("[fitness-coach/001] FR-17 Home provisional", () => {
  test("[fitness-coach/001] FR-17: saludo, resumen, pausadas y hora de la última sincronización", async ({
    page,
  }) => {
    await firstSync(
      page,
      api,
      makeSnapshot({ exercises: 29, activeRoutines: 7, pausedRoutines: 1 }),
    );
    await expect(page.getByText("Hola, Al")).toBeVisible();
    await expect(summary(page)).toContainText(summaryText(29, 7));
    await expect(summary(page)).toContainText("1 pausada");
    await expect(summary(page)).toContainText("Actualizado hace un momento");
  });

  test("[fitness-coach/001] FR-17: sin pausadas no hay línea de pausadas; varias en plural", async ({
    page,
  }) => {
    await firstSync(page, api, makeSnapshot({ pausedRoutines: 0 }));
    await expect(summary(page)).not.toContainText("pausada");

    await setTime(page, T0 + 2 * MIN);
    api.respondOk(makeSnapshot({ pausedRoutines: 2 }), '"etag-2"');
    await toForeground(page);
    await expect(summary(page)).toContainText("2 pausadas");
  });

  test("[fitness-coach/001] PRD §10: 0 rutinas activas no es un error", async ({ page }) => {
    await firstSync(page, api, makeSnapshot({ activeRoutines: 0, pausedRoutines: 0 }));
    await expect(summary(page)).toContainText("0 rutinas activas");
  });
});

test.describe("[fitness-coach/001] US-6 instalable", () => {
  test("[fitness-coach/001] AC-17: manifest «My Coach», standalone, iconos 192/512/maskable y apple-touch-icon", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBeTruthy();
    const manifest = await (await request.get(new URL(href!, page.url()).toString())).json();
    expect(manifest.name).toBe("My Coach");
    expect(manifest.short_name).toBe("My Coach");
    expect(manifest.display).toBe("standalone");
    expect(String(manifest.background_color).toLowerCase()).toBe("#15130f");
    expect(String(manifest.theme_color).toLowerCase()).toBe("#15130f");
    const icons: { src: string; sizes: string; purpose?: string }[] = manifest.icons;
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512")).toBe(true);
    expect(icons.some((i) => (i.purpose ?? "").includes("maskable"))).toBe(true);
    for (const i of icons) {
      const res = await request.get(new URL(i.src, page.url()).toString());
      expect(res.status()).toBe(200);
    }
    const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    expect(apple).toBeTruthy();
    expect((await request.get(new URL(apple!, page.url()).toString())).status()).toBe(200);
  });
});

test.describe("[fitness-coach/001] US-7 marco de la app", () => {
  test("[fitness-coach/001] AC-18: en móvil, barra inferior con Inicio activo; Rutinas y Ejercicios dicen «Próximamente»", async ({
    page,
  }) => {
    await firstSync(page, api);
    const home = page.getByTestId("nav-home");
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(home).toContainText("Inicio");
    await expect(page.getByTestId("nav-routines")).toContainText("Rutinas");
    await expect(page.getByTestId("nav-exercises")).toContainText("Ejercicios");
    const box = await home.boundingBox();
    expect(box!.y).toBeGreaterThan(page.viewportSize()!.height / 2); // at the bottom

    for (const nav of ["nav-routines", "nav-exercises"]) {
      await page.getByTestId(nav).click();
      await expect(page.getByText("Próximamente")).toBeVisible();
      await expect(page.getByTestId(nav)).toHaveAttribute("aria-current", "page");
      await expect(page.getByTestId("nav-home")).toBeVisible();
    }
  });

  test.describe("pantalla ancha", () => {
    test.use(DESKTOP);

    test("[fitness-coach/001] AC-19: desde 640 px, barra lateral con el icono y «My Coach»", async ({
      page,
    }) => {
      await firstSync(page, api);
      const nav = page.getByRole("navigation");
      await expect(nav).toContainText("My Coach");
      const box = await page.getByTestId("nav-home").boundingBox();
      expect(box!.x).toBeLessThan(240); // left side bar (224 px expanded)
      expect(box!.y).toBeLessThan(page.viewportSize()!.height / 2);
    });
  });
});

test.describe("[fitness-coach/001] PRD §10 casos límite", () => {
  test("[fitness-coach/001] PRD §10: sin almacenamiento, Toast que se cierra solo y la app funciona con red", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      IDBFactory.prototype.open = function () {
        throw new DOMException("blocked", "InvalidStateError");
      };
    });
    await firstSync(page, api);
    const toast = page.getByTestId("storage-toast");
    await expect(toast).toHaveText(
      "No se pueden guardar los datos en este dispositivo; sin conexión no funcionará.",
    );
    await expect(toast).toBeHidden({ timeout: 6_000 });
    await expect(summary(page)).toBeVisible();
  });

  test("[fitness-coach/001] PRD §10: 409 client_outdated → la app se recarga y vuelve a pedir el snapshot", async ({
    page,
  }) => {
    await firstSync(page, api);
    await setTime(page, T0 + 2 * MIN);
    let loads = 0;
    page.on("load", () => loads++);
    let sent409 = false;
    api.respond(() => {
      if (!sent409) {
        sent409 = true;
        return { kind: "status", status: 409 };
      }
      return { kind: "ok", snapshot: makeSnapshot({ exercises: 33 }), etag: '"etag-2"' };
    });
    await toForeground(page);
    await expect(summary(page)).toContainText("33 ejercicios");
    expect(loads).toBeGreaterThanOrEqual(1);
  });

  test("[fitness-coach/001] PRD §10: datos del navegador borrados → vuelve a pedir la clave", async ({
    page,
    context,
  }) => {
    await firstSync(page, api);
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs.map(
          (d) =>
            new Promise<void>((r) => {
              const req = indexedDB.deleteDatabase(d.name!);
              req.onsuccess = req.onerror = req.onblocked = () => r();
            }),
        ),
      );
    });
    await context.clearCookies();
    await page.reload();
    await expect(page.getByTestId("key-input")).toBeVisible();
  });
});
