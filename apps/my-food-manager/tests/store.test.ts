import { SNAPSHOT_SCHEMA_VERSION } from "@/lib/schema";
import { describe, expect, it, vi } from "vitest";
import { createLibraryStore, type Deps } from "@/lib/offline/store";
import { buildSnapshot } from "@/lib/domain/snapshot";
import { timeAgo } from "@/lib/domain/time";
import { fixtureDrive } from "./helpers";

async function snapshot(etagSuffix = "") {
  const { files, read } = fixtureDrive();
  const s = await buildSnapshot(files, read);
  return { ...s, etag: s.etag + etagSuffix };
}

function memoryStorage(initial?: unknown) {
  let value = initial as never;
  return {
    get: vi.fn(async () => value),
    set: vi.fn(async (v: never) => {
      value = v;
    }),
    peek: () => value as { etag: string; schemaVersion: number } | undefined,
  };
}

function setup(over: Partial<Deps> = {}, storage = memoryStorage()) {
  let online = true;
  const deps: Deps = {
    fetch: vi.fn() as unknown as typeof fetch,
    storage,
    now: () => new Date("2026-10-28T12:00:00Z"),
    isOnline: () => online,
    ...over,
  };
  const store = createLibraryStore(deps);
  return { store, deps, storage, setOnline: (v: boolean) => (online = v) };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("library store", () => {
  it("first sync loads and stores the library", async () => {
    const snap = await snapshot();
    const { store, deps, storage } = setup({ fetch: vi.fn(async () => json(snap)) as never });
    await store.hydrate();
    expect(store.getState()).toMatchObject({ hydrated: true, library: null });
    expect(await store.sync("open")).toBe("updated");
    expect(store.getState().library?.recipes).toHaveLength(3);
    expect(store.getState().status).toBe("idle");
    expect(store.getState().syncedAt).toBe("2026-10-28T12:00:00.000Z");
    expect(storage.peek()?.etag).toBe(snap.etag);
    expect(deps.fetch).toHaveBeenCalledWith(
      "/api/snapshot",
      expect.objectContaining({ headers: {} }),
    );
  });

  it("renders the stored copy on hydrate, before any network", async () => {
    const snap = await snapshot();
    const storage = memoryStorage({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      etag: snap.etag,
      syncedAt: "2026-10-28T11:00:00.000Z",
      data: snap.data,
      warnings: [],
    });
    const { store, deps } = setup({}, storage);
    await store.hydrate();
    expect(store.getState().library?.recipes).toHaveLength(3);
    expect(store.getState().syncedAt).toBe("2026-10-28T11:00:00.000Z");
    expect(deps.fetch).not.toHaveBeenCalled();
  });

  it("sends If-None-Match and treats 304 as unchanged, touching only syncedAt", async () => {
    const snap = await snapshot();
    const fetchMock = vi.fn(async () => new Response(null, { status: 304 }));
    const storage = memoryStorage({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      etag: snap.etag,
      syncedAt: "2026-10-28T11:00:00.000Z",
      data: snap.data,
      warnings: [],
    });
    const { store } = setup({ fetch: fetchMock as never }, storage);
    await store.hydrate();
    const before = store.getState().library;
    expect(await store.sync("open")).toBe("unchanged");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/snapshot",
      expect.objectContaining({ headers: { "If-None-Match": snap.etag } }),
    );
    expect(store.getState().library).toBe(before);
    expect(store.getState().syncedAt).toBe("2026-10-28T12:00:00.000Z");
  });

  it("keeps the stored copy when a sync fails", async () => {
    const snap = await snapshot();
    const storage = memoryStorage({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      etag: snap.etag,
      syncedAt: "x",
      data: snap.data,
      warnings: [],
    });
    const { store } = setup(
      {
        fetch: vi.fn(async () =>
          json({ error: { code: "DRIVE_UNAVAILABLE", message: "x" } }, 503),
        ) as never,
      },
      storage,
    );
    await store.hydrate();
    expect(await store.sync("manual")).toBe("failed");
    expect(store.getState().status).toBe("error");
    expect(store.getState().library?.recipes).toHaveLength(3);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("goes offline without calling the network and recovers on the next sync", async () => {
    const snap = await snapshot();
    const fetchMock = vi.fn(async () => json(snap));
    const { store, setOnline } = setup({ fetch: fetchMock as never });
    setOnline(false);
    await store.hydrate();
    expect(store.getState().status).toBe("offline");
    expect(await store.sync("open")).toBe("failed");
    expect(fetchMock).not.toHaveBeenCalled();
    setOnline(true);
    expect(await store.sync("online")).toBe("updated");
    expect(store.getState().status).toBe("idle");
  });

  it("reports offline when the request throws while the device is offline", async () => {
    const { store, setOnline } = setup({
      fetch: vi.fn(async () => {
        setOnline(false);
        throw new TypeError("network");
      }) as never,
    });
    await store.hydrate();
    expect(await store.sync("open")).toBe("failed");
    expect(store.getState().status).toBe("offline");
  });

  it("shares one in-flight sync between concurrent triggers", async () => {
    const snap = await snapshot();
    const fetchMock = vi.fn(async () => json(snap));
    const { store } = setup({ fetch: fetchMock as never });
    await store.hydrate();
    const [a, b] = await Promise.all([store.sync("open"), store.sync("interval")]);
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid payload and leaves the stored copy untouched", async () => {
    const { store, storage } = setup({ fetch: vi.fn(async () => json({ nope: true })) as never });
    await store.hydrate();
    expect(await store.sync("open")).toBe("failed");
    expect(store.getState().library).toBeNull();
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("keeps an older-schema copy usable offline and replaces it when online", async () => {
    const snap = await snapshot();
    const storage = memoryStorage({
      schemaVersion: 0,
      etag: "old",
      syncedAt: "x",
      data: snap.data,
      warnings: [],
    });
    const fetchMock = vi.fn(async () => json(snap));
    const { store } = setup({ fetch: fetchMock as never }, storage);
    await store.hydrate();
    expect(store.getState().library).not.toBeNull();
    await store.sync("open");
    // No If-None-Match: the old copy must be refetched, not revalidated.
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/snapshot",
      expect.objectContaining({ headers: {} }),
    );
    expect(storage.peek()?.schemaVersion).toBe(SNAPSHOT_SCHEMA_VERSION);
  });

  it("works in memory when device storage is unavailable", async () => {
    const snap = await snapshot();
    const storage = {
      get: vi.fn(async () => {
        throw new Error("denied");
      }),
      set: vi.fn(async () => {
        throw new Error("denied");
      }),
    };
    const { store } = setup({ fetch: vi.fn(async () => json(snap)) as never }, storage as never);
    await store.hydrate();
    expect(store.getState().storageOk).toBe(false);
    expect(await store.sync("open")).toBe("updated");
    expect(store.getState().library?.recipes).toHaveLength(3);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  it("formats minutes, hours and days in Spanish", () => {
    expect(timeAgo("2026-10-28T11:57:00Z", now)).toBe("hace 3 min");
    expect(timeAgo("2026-10-28T09:00:00Z", now)).toBe("hace 3 h");
    expect(timeAgo("2026-10-27T11:00:00Z", now)).toBe("hace 1 día");
  });
  it("never crashes on invalid or future dates", () => {
    expect(timeAgo("garbage", now)).toBe("hace un momento");
    expect(timeAgo("2026-10-28T13:00:00Z", now)).toBe("hace un momento");
    expect(timeAgo(undefined, now)).toBe("nunca");
  });
});

describe("library store: setPantry", () => {
  it("replaces the stored pantry and keeps the rest of the library", async () => {
    const snap = await snapshot();
    const { store, storage } = setup({ fetch: vi.fn(async () => json(snap)) as never });
    await store.hydrate();
    await store.sync("open");
    store.setPantry({ updated: "2026-10-30T10:00:00-05:00", have: ["leche"], to_buy: [] });
    expect(store.getState().library?.pantry).toMatchObject({ have: ["leche"], to_buy: [] });
    expect(store.getState().library?.recipes).toHaveLength(3);
    await vi.waitFor(() => expect(storage.set).toHaveBeenCalledTimes(2));
  });

  it("does nothing before a library is loaded", async () => {
    const { store } = setup();
    store.setPantry({ have: [], to_buy: [] });
    expect(store.getState().library).toBeNull();
  });
});
