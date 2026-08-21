"use client";

import { useMemo, useState } from "react";

import {
  fmtCount,
  fmtIndex,
  tableCellColorClass,
  type DeclineTableValueMode,
  type RegionIndexSeries,
} from "@/lib/analysis/school-age-decline-analytics";

type SchoolAgeDeclineDetailTableProps = {
  sidoSeries: RegionIndexSeries[];
  nationalSeries: RegionIndexSeries;
  valueMode: DeclineTableValueMode;
  onValueModeChange: (mode: DeclineTableValueMode) => void;
};

export function SchoolAgeDeclineDetailTable({
  sidoSeries,
  nationalSeries,
  valueMode,
  onValueModeChange,
}: SchoolAgeDeclineDetailTableProps) {
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
            시도별 연령/대입연도 상세 데이터
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            18세(차년도 대입)부터 0세 대입 연도까지의 인구 및 지수 데이터
            표입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="지역명 검색..."
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() =>
              onValueModeChange(valueMode === "index" ? "count" : "index")
            }
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-surface"
          >
            {valueMode === "index" ? "표시: 지수 (%)" : "표시: 인구 (명)"}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2 font-semibold text-muted">
              <th className=" min-w-[90px] bg-surface-2 p-2.5">
                지역
              </th>
              {nationalSeries.points.map((point, index) => (
                <th
                  key={point.year}
                  className={`min-w-[88px] p-2.5 text-right ${
                    index === nationalSeries.points.length - 1
                      ? "font-bold text-accent-orange"
                      : ""
                  }`}
                >
                  {point.year} ({point.ageLabel})
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredSeries.map((series) => {
              const isNational = series.region === "전국";
              return (
                <tr
                  key={series.region}
                  className="transition-colors hover:bg-surface-2/50"
                >
                  <td
                    className={` bg-surface p-2.5 font-bold ${
                      isNational ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {series.region}
                  </td>
                  {series.points.map((point, index) => {
                    const isFinal = index === series.points.length - 1;
                    const display =
                      valueMode === "index"
                        ? `${fmtIndex(point.index)}%`
                        : `${fmtCount(point.count)}명`;

                    return (
                      <td
                        key={point.year}
                        className={`p-2.5 text-right ${tableCellColorClass(point.index)} ${
                          isFinal ? "bg-accent-orange/10 font-bold" : ""
                        }`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
