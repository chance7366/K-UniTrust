"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  fmtIndex,
  type RiskTierGroup,
} from "@/lib/analysis/school-age-decline-analytics";

const TIER_STYLES = {
  high: {
    wrap: "bg-red-950/30 border-red-800/40",
    title: "text-red-400",
    dot: "bg-red-500",
    count: "text-red-400",
    chip: "bg-red-900/50 text-red-200 border-red-700/50",
  },
  mid: {
    wrap: "bg-amber-950/30 border-amber-800/40",
    title: "text-amber-400",
    dot: "bg-amber-500",
    count: "text-amber-400",
    chip: "bg-amber-900/50 text-amber-200 border-amber-700/50",
  },
  low: {
    wrap: "bg-emerald-950/30 border-emerald-800/40",
    title: "text-emerald-600",
    dot: "bg-emerald-500",
    count: "text-emerald-600",
    chip: "bg-emerald-900/50 text-emerald-200 border-emerald-700/50",
  },
} as const;

type SchoolAgeDeclineRiskMatrix2037Props = {
  groups: RiskTierGroup[];
  farYear: number;
  farAgeLabel: string;
};

export function SchoolAgeDeclineRiskMatrix2037({
  groups,
  farYear,
  farAgeLabel,
}: SchoolAgeDeclineRiskMatrix2037Props) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3 className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
          <AlertIcon className="h-4 w-4 text-red-400" />
          {farYear}년 위험도 등급 매트릭스
        </h3>
        <p className="mb-4 mt-2 text-xs text-muted">
          {farAgeLabel}가 대학에 진학하는 {farYear}년 기준, 18세 대비
          잔여지수별 지역 분포입니다.
        </p>

        <div className="space-y-3">
          {groups.map((group) => {
            const style = TIER_STYLES[group.id];
            return (
              <div
                key={group.id}
                className={`rounded-xl border p-3 ${style.wrap}`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1 text-xs font-bold ${style.title}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {group.title}
                  </span>
                  <span className={`font-mono ${FDB_TYPO.tableCode} font-bold ${style.count}`}>
                    {group.countLabel}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.regions.map((region) => (
                    <span
                      key={region.region}
                      className={`rounded border px-2 py-0.5 text-[11px] ${style.chip}`}
                    >
                      {region.region} ({fmtIndex(region.index)})
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-red-800/40 bg-red-950/40 p-3 text-xs text-red-300">
        <p className="mb-1 flex items-center gap-1.5 font-bold">
          <InfoIcon className="h-4 w-4 text-red-400" />
          대학 재정 위기 경고
        </p>
        <p className="text-[11px] leading-relaxed text-red-300/80">
          0세 대입 연도 지수가 45 미만인 지역은 현재 18세 대비 입학생 자원이
          55% 이상 줄어드는 것을 의미하며, 정원 미달에 따른 지방 대학의 연쇄
          구조조정이 불가피합니다.
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
