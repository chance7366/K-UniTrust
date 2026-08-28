"use client";

import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import "@/components/analysis/glass-help-button.css";

export type SchoolKindTabId = SchoolKindFilter | "all";

type SchoolKindTabBarBase = {
  universityCount: number;
  juniorCollegeCount: number;
  ariaLabel?: string;
  allCount?: number;
};

type SchoolKindTabBarProps =
  | (SchoolKindTabBarBase & {
      showAll?: false;
      active: SchoolKindFilter;
      onChange: (filter: SchoolKindFilter) => void;
    })
  | (SchoolKindTabBarBase & {
      showAll: true;
      active: SchoolKindTabId;
      onChange: (filter: SchoolKindTabId) => void;
    });

export function SchoolKindTabBar(props: SchoolKindTabBarProps) {
  const {
    active,
    universityCount,
    juniorCollegeCount,
    onChange,
    ariaLabel = "학교종류별 결과",
    allCount,
  } = props;
  const showAll = props.showAll === true;

  const tabs: { id: SchoolKindTabId; label: string; count: number }[] = [
    { id: "university", label: "대학", count: universityCount },
    { id: "junior-college", label: "전문대학", count: juniorCollegeCount },
  ];
  if (showAll) {
    tabs.push({
      id: "all",
      label: "전체대학",
      count: allCount ?? universityCount + juniorCollegeCount,
    });
  }

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
            onClick={() => {
              if (showAll) {
                (onChange as (filter: SchoolKindTabId) => void)(tab.id);
                return;
              }
              if (tab.id === "all") return;
              (onChange as (filter: SchoolKindFilter) => void)(tab.id);
            }}
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
