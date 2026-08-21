"use client";

import { Fragment, useMemo, useState } from "react";

import {
  fmtRegionalIndex,
  type RegionalDeclineSeries,
} from "@/lib/analysis/regional-decline-dashboard-analytics";
import { getExtinctionRiskGradeStyle } from "@/lib/analysis/regional-decline-grade";

type RegionalDeclineDetailTableProps = {
  years: number[];
  sidoSeries: RegionalDeclineSeries[];
  nationalSeries: RegionalDeclineSeries;
};

export function RegionalDeclineDetailTable({
  years,
  sidoSeries,
  nationalSeries,
}: RegionalDeclineDetailTableProps) {
  const [search, setSearch] = useState("");
  const allSeries = useMemo(
    () => [nationalSeries, ...sidoSeries],
    [nationalSeries, sidoSeries],
  );

  const filteredSeries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allSeries;
    return allSeries.filter((series) =>
      series.region.toLowerCase().includes(query),
    );
  }, [allSeries, search]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <TableIcon className="h-4 w-4 text-accent" />
            시도별 연도별 소멸위험지수 · 등급
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {years[0]}년부터 {years[years.length - 1]}년까지의 소멸위험지수와
            등급 상세 데이터입니다.
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="지역명 검색..."
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2 font-semibold text-muted">
              <th className=" min-w-[90px] bg-surface-2 p-2.5">
                지역
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  colSpan={2}
                  className="min-w-[100px] p-2.5 text-center"
                >
                  {year}년
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 text-[10px] text-muted">
              <th className=" bg-surface-2 p-2" />
              {years.map((year) => (
                <Fragment key={year}>
                  <th className="p-2 text-right">지수</th>
                  <th className="p-2 text-center">등급</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSeries.map((series) => (
              <tr
                key={series.region}
                className="border-b border-border/50 hover:bg-accent/5"
              >
                <td className=" bg-surface p-2.5 font-medium">
                  {series.region}
                </td>
                {years.map((year) => {
                  const point = series.points.find((p) => p.year === year);
                  if (!point) {
                    return (
                      <Fragment key={`${series.region}-${year}`}>
                        <td className="p-2.5 text-right text-muted">—</td>
                        <td className="p-2.5 text-center text-muted">—</td>
                      </Fragment>
                    );
                  }
                  const style = getExtinctionRiskGradeStyle(point.grade);
                  return (
                    <Fragment key={`${series.region}-${year}`}>
                      <td
                        className="p-2.5 text-right font-mono font-semibold"
                        style={{ color: style.bg }}
                      >
                        {fmtRegionalIndex(point.index)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                          }}
                        >
                          {style.label}
                        </span>
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
