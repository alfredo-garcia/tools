"use client";

import { useLayoutEffect, useRef } from "react";

const DURATION = 220;

/**
 * FLIP animation for a vertical list: children with `data-flip-key` slide from their old position to
 * the new one and new children fade in. `signature` must change whenever the list content or order does.
 * The container must be positioned (`relative`) so `offsetTop` is measured against it.
 */
export function useListReorder<T extends HTMLElement>(signature: string) {
  const ref = useRef<T>(null);
  const tops = useRef<Map<string, number> | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) {
      tops.current = null;
      return;
    }
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-flip-key]"));
    const previous = tops.current;
    const next = new Map(items.map((el) => [el.dataset.flipKey!, el.offsetTop]));
    tops.current = next;
    if (!previous || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const options = { duration: DURATION, easing: "ease-out" };
    for (const el of items) {
      const key = el.dataset.flipKey!;
      const before = previous.get(key);
      if (before === undefined) {
        el.animate(
          [
            { opacity: 0, transform: "translateY(8px) scale(0.98)" },
            { opacity: 1, transform: "none" },
          ],
          options,
        );
      } else {
        const dy = before - next.get(key)!;
        if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], options);
      }
    }
  }, [signature]);

  return ref;
}
