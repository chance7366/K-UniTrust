"use client";

import type { ReactNode } from "react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { AnalysisYearSelector } from "@/components/analysis/competitiveness-analysis/AnalysisYearSelector";

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  settings: {
    title: "기본설정",
    subtitle: "대상대학 · 적용지표 · 가중치 · 분석방법",
  },
  run: {
    title: "분석결과",
    subtitle: "원지표 · 지수·순위 · 종합지수 · 통계분석",
  },
  trend: {
    title: "재정추계분석",
    subtitle: "저장된 연도별 분석결과 · 종합지수·순위 추세",
  },
  university: {
    title: "대학별경쟁력",
    subtitle: "분석대상학교 · 지표 · 순위 · 연도별 추세",
  },
};

export function CompetitivenessShell({
  activeTab,
  children,
}: {
  activeTab: string;
  children: ReactNode;
}) {
  const meta = TAB_META[activeTab] ?? TAB_META.settings;
  const sectionLabel =
    activeTab === "trend" ? "재정추계분석" : "대학경쟁력분석";

  return (
    <div className="flex flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel={sectionLabel}
        subtitle={meta.subtitle}
        title={meta.title}
      />

      <div className="flex flex-col gap-1">
        {activeTab === "run" ? null : <AnalysisYearSelector />}
        {children}
      </div>
    </div>
  );
}
