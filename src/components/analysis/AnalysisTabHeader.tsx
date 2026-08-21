"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export type AnalysisTabHeaderProps = {
  title: string;
  description?: string;
  /** When set with onYearChange, renders year selector on the right. */
  years?: number[];
  year?: number;
  onYearChange?: (year: number) => void;
  yearCaption?: string;
};

export function AnalysisTabHeader({
  title,
  description,
  years,
  year,
  onYearChange,
  yearCaption = "공시연도 (svyYr)",
}: AnalysisTabHeaderProps) {
  const showYear =
    years != null &&
    years.length > 0 &&
    year != null &&
    onYearChange != null;

  const selectId = `analysis-year-${title.replace(/\s+/g, "-")}`;
  const safeYear =
    showYear && years.includes(year) ? year : (years?.[0] ?? year);

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <h3 className={`${FDB_TYPO.panelTitle} leading-tight`}>{title}</h3>
        {description ? (
          <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>{description}</p>
        ) : null}
      </div>
      {showYear && safeYear != null ? (
        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor={selectId} className={`text-right ${FDB_TYPO.toolbarLabel}`}>
            <span className="block">조회 연도</span>
            <span className="font-medium text-foreground">{yearCaption}</span>
          </label>
          <select
            id={selectId}
            value={safeYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={`rounded-md border border-border bg-surface-2 px-3 py-1.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 ${FDB_TYPO.toolbarControl}`}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </section>
  );
}

/** Filter CSV rows by svy_yr when tab requires a survey year. */
export function filterRowsByYear(
  rows: Record<string, string>[],
  year: number,
  needsYear: boolean,
): Record<string, string>[] {
  if (!needsYear) return rows;
  const y = String(year);
  return rows.filter((r) => (r.svy_yr ?? "") === y);
}
