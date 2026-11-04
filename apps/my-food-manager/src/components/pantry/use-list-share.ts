"use client";

import { useCallback, useEffect, useState } from "react";

const NOTICE_MS = 4000;

/** Shares the shopping list as text through the device's share menu; without one it copies the text. */
export function useListShare(text: string) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const share = useCallback(async () => {
    if (busy) return;
    if (typeof navigator.share !== "function") {
      try {
        await navigator.clipboard.writeText(text);
        setNotice("Lista copiada");
      } catch {
        setNotice("No se pudo copiar la lista");
      }
      return;
    }
    setBusy(true);
    try {
      // Text only: some apps put `title` before `text`, which would repeat the heading.
      await navigator.share({ text });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setNotice("No se pudo compartir");
    } finally {
      setBusy(false);
    }
  }, [busy, text]);

  return { share, busy, notice };
}
