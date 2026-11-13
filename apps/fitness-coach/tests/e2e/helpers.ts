import { expect, type BrowserContext, type Page, type Route } from "@playwright/test";
import { makeSnapshot, type SnapshotDoc } from "../fixtures/snapshot";

export const KEY = "clave-de-test";
/** Fixed "now" for every test: 2026-11-12 12:00 in UTC-5. */
export const T0 = new Date("2026-11-12T12:00:00-05:00").getTime();
export const MIN = 60_000;
export const H = 60 * MIN;

type Reply =
  | { kind: "ok"; snapshot: SnapshotDoc; etag: string }
  | { kind: "status"; status: 304 | 401 | 409 | 500 | 502; code?: string }
  | { kind: "hang" };

export type SeenRequest = { url: string; headers: Record<string, string> };

/**
 * Mock of GET /api/snapshot at context level (so requests made by the service worker are
 * intercepted too). Never reaches the real server route or the Drive.
 */
export class SnapshotApi {
  requests: SeenRequest[] = [];
  offline = false;
  private reply: (req: SeenRequest) => Reply = () => ({ kind: "status", status: 502 });
  private gate: Promise<void> | null = null;
  private openGate: (() => void) | null = null;

  static async install(context: BrowserContext) {
    const api = new SnapshotApi();
    await context.route("**/api/snapshot*", (route) => api.handle(route));
    return api;
  }

  /** Set the response; `fn` can inspect the request (key, If-None-Match). */
  respond(fn: (req: SeenRequest) => Reply) {
    this.reply = fn;
  }
  respondOk(snapshot: SnapshotDoc, etag = '"etag-1"') {
    this.respond(() => ({ kind: "ok", snapshot, etag }));
  }
  respondStatus(status: 304 | 401 | 409 | 500 | 502, code?: string) {
    this.respond(() => ({ kind: "status", status, code }));
  }
  /** Following responses wait until `release()` is called. */
  hold() {
    this.gate = new Promise((r) => (this.openGate = r));
  }
  release() {
    this.openGate?.();
    this.gate = null;
  }
  get count() {
    return this.requests.length;
  }

  private async handle(route: Route) {
    const req = route.request();
    const seen = { url: req.url(), headers: req.headers() };
    this.requests.push(seen);
    if (this.offline) return route.abort("internetdisconnected");
    if (this.gate) await this.gate;
    const r = this.reply(seen);
    if (r.kind === "hang") return; // never answered
    if (r.kind === "ok") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { etag: r.etag, "cache-control": "private, no-store" },
        body: JSON.stringify(r.snapshot),
      });
    }
    if (r.status === 304) return route.fulfill({ status: 304, headers: {} });
    const code =
      r.code ??
      { 401: "invalid_key", 409: "client_outdated", 500: "server_misconfigured", 502: "drive_unavailable" }[
        r.status
      ];
    return route.fulfill({
      status: r.status,
      contentType: "application/json",
      body: JSON.stringify({ error: { code, message: "test" } }),
    });
  }
}

/**
 * Makes `navigator.onLine` controllable without a service worker (the page itself still loads).
 * The value survives reloads (localStorage key `__e2e_offline`, test-only).
 */
export async function installFakeNetwork(page: Page, startOffline = false) {
  await page.addInitScript((startOffline: boolean) => {
    if (localStorage.getItem("__e2e_offline") === null) {
      localStorage.setItem("__e2e_offline", startOffline ? "1" : "0");
    }
    Object.defineProperty(Navigator.prototype, "onLine", {
      configurable: true,
      get: () => localStorage.getItem("__e2e_offline") !== "1",
    });
  }, startOffline);
}

export async function setOnline(page: Page, api: SnapshotApi, online: boolean) {
  api.offline = !online;
  await page.evaluate((online: boolean) => {
    localStorage.setItem("__e2e_offline", online ? "0" : "1");
    window.dispatchEvent(new Event(online ? "online" : "offline"));
  }, online);
}

/** The app goes to the background and comes back (visibilitychange hidden → visible). */
export async function toForeground(page: Page) {
  await page.evaluate(() => {
    const set = (v: DocumentVisibilityState) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => v === "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    set("hidden");
    set("visible");
  });
}

/** Real touch drag from the top of the content downwards (pull-to-refresh), via CDP. */
export async function pullToRefresh(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const vp = page.viewportSize()!;
  const x = Math.round(vp.width / 2);
  let y = 160;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 0; i < 12; i++) {
    y += 25;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

export async function setTime(page: Page, ms: number) {
  await page.clock.setFixedTime(new Date(ms));
}

/** First open with network: types the key, enters, and waits for the provisional Home. */
export async function firstSync(page: Page, api: SnapshotApi, snapshot = makeSnapshot()) {
  api.respondOk(snapshot);
  await page.goto("/");
  await page.getByTestId("key-input").fill(KEY);
  await page.getByTestId("enter-button").click();
  await expect(page.getByTestId("summary-card")).toBeVisible();
}

export function summaryText(exercises: number, active: number) {
  return `${exercises} ejercicios · ${active} rutinas activas`;
}

export { makeSnapshot };
