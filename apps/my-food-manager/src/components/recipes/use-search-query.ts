"use client";

import { useCallback, useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS, appliedQuery } from "@/lib/domain/search";

/** Typed text plus the text that takes effect: after the debounce, on Enter, or at once on clear. */
export function useSearchQuery() {
  const [typed, setTyped] = useState("");
  const [applied, setApplied] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setApplied(appliedQuery(typed)), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed]);

  const applyNow = useCallback(() => setApplied(appliedQuery(typed)), [typed]);
  const clear = useCallback(() => {
    setTyped("");
    setApplied("");
  }, []);

  return { typed, applied, setTyped, applyNow, clear };
}
