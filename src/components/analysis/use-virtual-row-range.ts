"use client";

import { useEffect, useState, type RefObject } from "react";

export const VIRTUAL_ROW_HEIGHT = 34;
export const VIRTUAL_OVERSCAN = 16;
export const VIRTUALIZE_MIN_ROWS = 50;

export function useVirtualRowRange(
  enabled: boolean,
  rowCount: number,
  wrapRef: RefObject<HTMLDivElement | null>,
) {
  const [range, setRange] = useState({
    start: 0,
    end: enabled ? Math.min(rowCount, 48) : rowCount,
  });

  useEffect(() => {
    if (!enabled) {
      setRange({ start: 0, end: rowCount });
      return;
    }
    const el = wrapRef.current;
    if (!el) return;

    function update() {
      const start = Math.max(
        0,
        Math.floor(el.scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
      );
      const end = Math.min(
        rowCount,
        Math.ceil((el.scrollTop + el.clientHeight) / VIRTUAL_ROW_HEIGHT) +
          VIRTUAL_OVERSCAN,
      );
      setRange((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [enabled, rowCount, wrapRef]);

  return range;
}
