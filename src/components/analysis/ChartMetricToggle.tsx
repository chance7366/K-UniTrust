"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export function ChartMetricToggle<T extends string>({
  value,
  onChange,
  labels,
}: {
  value: T;
  onChange: (metric: T) => void;
  labels: Record<T, string>;
}) {
  const options = Object.keys(labels) as T[];

  return (
    <div className="inline-flex h-[30px] max-w-full items-stretch overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5">
      {options.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`shrink-0 rounded px-2.5 py-1 transition-colors ${
            value === key
              ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
              : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
          }`}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}
