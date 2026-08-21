"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

export function SchoolKindTabBar({
  active,
  universityCount,
  juniorCollegeCount,
  onChange,
  ariaLabel = "학교종류별 결과",
}: {
  active: SchoolKindFilter;
  universityCount: number;
  juniorCollegeCount: number;
  onChange: (filter: SchoolKindFilter) => void;
  ariaLabel?: string;
}) {
  const tabs: { id: SchoolKindFilter; label: string; count: number }[] = [
    { id: "university", label: "대학", count: universityCount },
    { id: "junior-college", label: "전문대학", count: juniorCollegeCount },
  ];

  return (
    <div
      className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-[10px] font-semibold ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-surface text-muted"
              }`}
            >
              {tab.count.toLocaleString("ko-KR")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
