"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  fmtRegionalIndex,
  type RegionalDeclineGradeGroup,
} from "@/lib/analysis/regional-decline-dashboard-analytics";

type RegionalDeclineGradeMatrixProps = {
  latestYear: number;
  groups: RegionalDeclineGradeGroup[];
};

export function RegionalDeclineGradeMatrix({
  latestYear,
  groups,
}: RegionalDeclineGradeMatrixProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3 className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
          <AlertIcon className="h-4 w-4 text-red-400" />
          {latestYear}년 소멸위험등급 매트릭스
        </h3>
        <p className="mb-4 mt-2 text-xs text-muted">
          {latestYear}년 기준 소멸위험등급(0~5)별 시·도 분포입니다. 등급이
          높을수록 소멸 위험이 큽니다.
        </p>

        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.grade}
              className="rounded-xl border border-border/60 bg-surface-2/50 p-3"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span
                    className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded px-1.5 text-[11px] font-bold"
                    style={{
                      backgroundColor: group.color,
                      color: group.grade >= 3 ? "#1a1a1a" : "#ffffff",
                    }}
                  >
                    {group.grade}
                  </span>
                  {group.label}
                </span>
                <span className={`font-mono ${FDB_TYPO.tableCode} font-bold text-muted` }>
                  {group.countLabel}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.regions.map((region) => (
                  <span
                    key={region.region}
                    className="rounded border border-border/60 bg-surface px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {region.region} ({fmtRegionalIndex(region.index)})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-red-800/40 bg-red-950/40 p-3 text-xs text-red-300">
        <p className="mb-1 flex items-center gap-1.5 font-bold">
          <InfoIcon className="h-4 w-4 text-red-400" />
          지역소멸 위험 안내
        </p>
        <p className="text-[11px] leading-relaxed text-red-300/80">
          소멸위험지수는 인구·경제·행정 지표를 종합한 값이며, 등급 4~5는
          지방소멸 위험이 매우 높은 구간입니다.
        </p>
      </div>
    </div>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <polygon points="7.86 2 16.14 2 22 12 16.14 22 7.86 22 2 12" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
