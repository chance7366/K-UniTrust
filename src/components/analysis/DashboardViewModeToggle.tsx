"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export function DashboardViewModeToggle({
  value,
  onChange,
}: {
  value: "campus" | "consolidated";
  onChange: (mode: "campus" | "consolidated") => void;
}) {
  return (
    <div className="inline-flex h-[30px] items-stretch rounded-md border border-border bg-surface-2 p-0.5">
      <button
        type="button"
        onClick={() => onChange("campus")}
        className={`rounded px-2.5 py-1 transition-colors ${
          value === "campus"
            ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
            : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
        }`}
      >
        캠퍼스별
      </button>
      <button
        type="button"
        onClick={() => onChange("consolidated")}
        className={`rounded px-2.5 py-1 transition-colors ${
          value === "consolidated"
            ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
            : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
        }`}
      >
        본교통합
      </button>
    </div>
  );
}
