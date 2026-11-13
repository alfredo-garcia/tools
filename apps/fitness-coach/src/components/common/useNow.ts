"use client";
import { useEffect, useState } from "react";

/**
 * Current time for relative ages ("hace 5 min"): refreshed every `intervalMs` and whenever one of
 * `deps` changes (a new sync time or status must show its age at once).
 */
export function useNow(intervalMs: number, deps: readonly unknown[] = []): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
  return now;
}
