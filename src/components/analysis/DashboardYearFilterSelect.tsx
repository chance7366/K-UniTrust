"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export function DashboardYearFilterSelect({
  label = "표시 연도",
  value,
  years,
  onChange,
}: {
  label?: string;
  value: number;
  years: number[];
  onChange: (year: number) => void;
}) {
  const sortedYears = [...years].sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        {sortedYears.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
  );
}
