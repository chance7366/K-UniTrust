"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export type AnalysisViewTab = "dashboard" | "regional" | "comparison";

const VIEW_TAB_LABELS: Record<AnalysisViewTab, string> = {
  dashboard: "분석대시보드",
  regional: "지역별통계",
  comparison: "대학비교통계",
};

export function getAvailableViewTabs(options: {
  hasRegional?: boolean;
  hasComparison?: boolean;
}): AnalysisViewTab[] {
  const tabs: AnalysisViewTab[] = ["dashboard"];
  if (options.hasRegional) tabs.push("regional");
  if (options.hasComparison) tabs.push("comparison");
  return tabs;
}

export function parseViewTab(
  value: string | null,
  available: AnalysisViewTab[],
): AnalysisViewTab {
  if (value === "regional" || value === "comparison" || value === "dashboard") {
    if (available.includes(value)) return value;
  }
  return available[0] ?? "dashboard";
}

export function AnalysisViewTabBar({
  active,
  available,
  onChange,
}: {
  active: AnalysisViewTab;
  available: AnalysisViewTab[];
  onChange: (tab: AnalysisViewTab) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1"
      role="tablist"
    >
      {available.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          onClick={() => onChange(id)}
          className={`rounded-md px-4 py-2 transition-colors ${
            active === id
              ? `${FDB_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`
              : `${FDB_TYPO.sectionTabInactive} hover:text-foreground`}
          }`}
        >
          {VIEW_TAB_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

export function AnalysisDashboardPlaceholder({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
      <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
        분석대시보드
      </p>
      <h4 className={`mt-2 ${FDB_TYPO.panelTitle}`}>
        {title ?? "추후 정의 예정"}
      </h4>
      <p className={`mx-auto mt-3 max-w-md ${FDB_TYPO.bodyText}`}>
        {description ??
          "KPI 카드, 추세 차트, 지역·전국 비교, 상·하위 대학 요약 등이 이 탭에 배치됩니다."}
      </p>
    </section>
  );
}

/** Manages view tab state synced with URL `view` param. */
export function useAnalysisViewTab(
  available: AnalysisViewTab[],
  viewParam: string | null,
  onViewChange: (view: AnalysisViewTab) => void,
) {
  const [viewTab, setViewTab] = useState<AnalysisViewTab>(() =>
    parseViewTab(viewParam, available),
  );

  const availableKey = available.join(",");

  useEffect(() => {
    setViewTab(parseViewTab(viewParam, available));
  }, [viewParam, availableKey, available]);

  function setView(next: AnalysisViewTab) {
    setViewTab(next);
    onViewChange(next);
  }

  return [viewTab, setView] as const;
}

export function AnalysisViewShell({
  available,
  viewTab,
  onViewTabChange,
  dashboard,
  regional,
  comparison,
}: {
  available: AnalysisViewTab[];
  viewTab: AnalysisViewTab;
  onViewTabChange: (tab: AnalysisViewTab) => void;
  dashboard: ReactNode;
  regional?: ReactNode;
  comparison?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <AnalysisViewTabBar
        active={viewTab}
        available={available}
        onChange={onViewTabChange}
      />
      {viewTab === "dashboard" ? dashboard : null}
      {viewTab === "regional" ? regional : null}
      {viewTab === "comparison" ? comparison : null}
    </div>
  );
}
