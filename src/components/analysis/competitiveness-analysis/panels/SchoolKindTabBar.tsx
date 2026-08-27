"use client";

import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import "@/components/analysis/glass-help-button.css";

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
    <div className="glass-mint-seg glass-mint-seg--pill" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`glass-mint-seg-item${isActive ? " is-on" : ""}`}
          >
            {tab.label}
            <span className="glass-mint-seg-count">{tab.count.toLocaleString("ko-KR")}</span>
          </button>
        );
      })}
    </div>
  );
}
