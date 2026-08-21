"use client";

import { useRef } from "react";

import {
  VIRTUALIZE_MIN_ROWS,
  VIRTUAL_ROW_HEIGHT,
  useVirtualRowRange,
} from "@/components/analysis/use-virtual-row-range";

export function useVirtualizedRows(rowCount: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const virtualize = rowCount >= VIRTUALIZE_MIN_ROWS;
  const { start, end } = useVirtualRowRange(virtualize, rowCount, wrapRef);
  return {
    wrapRef,
    virtualize,
    start,
    end,
    topPad: virtualize ? start * VIRTUAL_ROW_HEIGHT : 0,
    bottomPad: virtualize ? (rowCount - end) * VIRTUAL_ROW_HEIGHT : 0,
    slice<T>(rows: T[]): T[] {
      return virtualize ? rows.slice(start, end) : rows;
    },
    rowIndex(visibleIndex: number) {
      return virtualize ? start + visibleIndex : visibleIndex;
    },
  };
}

export function VirtualPadRow({
  colSpan,
  height,
}: {
  colSpan: number;
  height: number;
}) {
  if (height <= 0) return null;
  return (
    <tr aria-hidden>
      <td
        colSpan={Math.max(colSpan, 1)}
        style={{ height, padding: 0, border: 0 }}
      />
    </tr>
  );
}
