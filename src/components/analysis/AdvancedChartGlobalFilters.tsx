"use client";

import type { ReactNode } from "react";

import { DashboardViewModeToggle } from "@/components/analysis/DashboardViewModeToggle";
import { DashboardYearFilterSelect } from "@/components/analysis/DashboardYearFilterSelect";
import type { AdvancedChartFilterOptions } from "@/lib/analysis/advanced-chart-filters";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 transition-colors ${CHART_TYPO.toolbarControl} ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-surface-2 text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function DbViewToggle({
  value,
  onChange,
}: {
  value: "campus" | "consolidated";
  onChange: (mode: "campus" | "consolidated") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      <button
        type="button"
        onClick={() => onChange("campus")}
        className={`rounded-md px-3 py-1.5 transition-colors ${CHART_TYPO.toolbarControl} ${
          value === "campus"
            ? "bg-accent/15 text-accent shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        캠퍼스별
      </button>
      <button
        type="button"
        onClick={() => onChange("consolidated")}
        className={`rounded-md px-3 py-1.5 transition-colors ${CHART_TYPO.toolbarControl} ${
          value === "consolidated"
            ? "bg-accent/15 text-accent shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        본교통합
      </button>
    </div>
  );
}

type Props = {
  years: number[];
  year: number;
  onYearChange: (year: number) => void;
  estb?: string;
  onEstbChange?: (estb: string) => void;
  schoolDivision?: string;
  onSchoolDivisionChange?: (schoolDivision: string) => void;
  schoolKinds?: string[];
  onSchoolKindsChange?: (schoolKinds: string[]) => void;
  filterOptions?: AdvancedChartFilterOptions;
  fixedEstb?: string;
  hasActiveFilter?: boolean;
  onResetFilters?: () => void;
  /** 학생충원 등 캠퍼스별/본교통합 DB 전환 */
  dbViewMode?: "campus" | "consolidated";
  onDbViewModeChange?: (mode: "campus" | "consolidated") => void;
  /**
   * financeToolbar = 신입생충원율 대학별DB와 동일(1행: 연도·도움말)
   * dbTwoRow = 구 2행 배치(하위 호환)
   * inline = 기존 한 줄 배치
   */
  layout?: "inline" | "dbTwoRow" | "financeToolbar";
  /** dbTwoRow일 때 좌측 제목 영역 */
  filterTitle?: string;
  filterTitleHelp?: ReactNode;
  /** financeToolbar / dbTwoRow 우측 추가 액션(도움말 보기 등) */
  filterHeaderActions?: ReactNode;
  /** financeToolbar에서 표시 연도 앞에 배치 */
  filterToolbarLeading?: ReactNode;
};

export function AdvancedChartGlobalFilters({
  years,
  year,
  onYearChange,
  dbViewMode,
  onDbViewModeChange,
  layout = "inline",
  filterTitle = "글로벌 필터",
  filterTitleHelp,
  filterHeaderActions,
  filterToolbarLeading,
}: Props) {
  const useFinanceToolbar = layout === "financeToolbar";
  const useDbTwoRow =
    layout === "dbTwoRow" &&
    dbViewMode != null &&
    onDbViewModeChange != null;

  if (useFinanceToolbar) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <DashboardYearFilterSelect
          value={year}
          years={years}
          onChange={onYearChange}
        />
        {filterToolbarLeading}
        {dbViewMode != null && onDbViewModeChange ? (
          <DashboardViewModeToggle
            value={dbViewMode}
            onChange={onDbViewModeChange}
          />
        ) : null}
        {filterHeaderActions ? (
          <div className="ml-auto shrink-0">{filterHeaderActions}</div>
        ) : null}
      </div>
    );
  }

  if (useDbTwoRow) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className={CHART_TYPO.filterTitle}>{filterTitle}</p>
            {filterTitleHelp}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DbViewToggle value={dbViewMode} onChange={onDbViewModeChange} />
            <div className="flex flex-wrap items-center gap-2">
              <span className={CHART_TYPO.filterLabel}>표시 연도</span>
              {years.map((y) => (
                <FilterChip
                  key={y}
                  label={`${y}년`}
                  active={year === y}
                  onClick={() => onYearChange(y)}
                />
              ))}
            </div>
            {filterHeaderActions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
      {dbViewMode != null && onDbViewModeChange ? (
        <div className="flex items-center gap-2">
          <span className={CHART_TYPO.filterLabel}>DB 보기</span>
          <DbViewToggle value={dbViewMode} onChange={onDbViewModeChange} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className={CHART_TYPO.filterLabel}>연도</span>
        {years.map((y) => (
          <FilterChip
            key={y}
            label={`${y}년`}
            active={year === y}
            onClick={() => onYearChange(y)}
          />
        ))}
      </div>
    </div>
  );
}
