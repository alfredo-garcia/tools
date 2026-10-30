"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getOutbox, startOutbox } from "./outbox-client";
import type { OutboxState } from "./outbox";

const SERVER_STATE: OutboxState = {
  hydrated: false,
  pending: [],
  sending: false,
  hasKey: false,
  keyRejected: false,
  notices: [],
  storageOk: true,
};

export function useOutbox(): OutboxState {
  const outbox = getOutbox();
  return useSyncExternalStore(outbox.subscribe, outbox.getState, () => SERVER_STATE);
}

/** Mount once near the root, next to the library sync. */
export function useStartOutbox() {
  useEffect(() => startOutbox(), []);
}
