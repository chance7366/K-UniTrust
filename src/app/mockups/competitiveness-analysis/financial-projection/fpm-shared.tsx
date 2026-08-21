"use client";

import { HelpTip } from "@/components/analysis/FundSecureRateAdvancedHelp";
import type { HelpSection } from "@/lib/analysis/advanced-chart-help";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import { useState, type ReactNode } from "react";
import type {
  AccountCostClass,
  ProjectionRowKind,
  SimulationScenario,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import {
  FP_ANALYSIS_YEAR,
  FP_DEFAULT_ANALYSIS_YEAR,
  FP_END_YEAR,
  FP_HISTORY_START_YEAR,
  FP_SETTLEMENT_YEAR,
  isFpAnalysisYear,
  projectionEndYearOf,
  settlementYearOf,
} from "@/lib/competitiveness-analysis/financial-projection/years";

export const YOY_BLUE = "#3B82F6";
export const BAR_FILL = CHART_THEME.amber;
export const TICK = { fontSize: CHART_TYPO.tickPx, fill: CHART_THEME.axisLabel };
export const START_YEAR = FP_HISTORY_START_YEAR;
export const END_YEAR = FP_END_YEAR;
export {
  FP_ANALYSIS_YEAR,
  FP_DEFAULT_ANALYSIS_YEAR,
  FP_SETTLEMENT_YEAR,
  isFpAnalysisYear,
  projectionEndYearOf,
  settlementYearOf,
};

export const ROW_KIND_LABEL: Record<ProjectionRowKind, string> = {
  actual: "실적(교비)",
  estimate: "추정(알리미)",
  forecast: "전망",
};

export const SCENARIO_LABEL: Record<SimulationScenario, string> = {
  best: "낙관",
  base: "기본",
  worst: "비관",
  stress: "한계",
};

export const CLASS_LABEL: Record<AccountCostClass, string> = {
  fc: "고정비",
  vc: "변동비",
  grant: "보조금대응",
  exclude: "제외",
};

export function tickProps() {
  return TICK;
}

export function SlimTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5"
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
            className={`inline-flex h-[30px] shrink-0 items-center rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  hint,
  help,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
  hint?: string;
  help?: HelpSection;
}) {
  return (
    <div className="space-y-1">
      <div className="fpm-slider-label">
        <span className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          {help ? <HelpTip help={help} wide /> : null}
        </span>
        <span className="inline-flex items-center gap-1 font-mono font-semibold text-foreground">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              onChange(Math.min(max, Math.max(min, n)));
            }}
            className="w-[4.75rem] rounded border border-border bg-transparent px-1 py-0.5 text-right font-mono text-sm"
            aria-label={label}
          />
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
      {hint ? <p className={CHART_TYPO.legend}>{hint}</p> : null}
    </div>
  );
}

export function StatusChip({ status }: { status: "ok" | "warn" | "missing" }) {
  const label =
    status === "ok" ? "보유" : status === "warn" ? "가정값" : "미적용";
  return <span className={`fpm-status fpm-status-${status}`}>{label}</span>;
}

export function RiskStageChip({
  stage,
}: {
  stage: { label: string; tone: string; hint?: string };
}) {
  return (
    <span
      className={`fpm-status fpm-status-stage-${stage.tone}`}
      title={stage.hint}
    >
      {stage.label}
    </span>
  );
}

export {
  RISK_MID_HORIZON_YEARS,
  RISK_NEAR_HORIZON_YEARS,
  riskStage,
  yearsUntilDepletion,
} from "@/lib/competitiveness-analysis/financial-projection/risk-stage";

export function yearOrDash(y: number | null) {
  return y == null ? "구간 내 없음" : `${y}년`;
}

export function FpAnalysisYearBar({
  analysisYear,
  availableYears,
  settlementYear,
  endYear,
  hasRun,
  runStale = false,
  coverage,
  onChange,
  onAddYear,
  showAddYear = true,
  showYearMeta = true,
  afterStatus,
}: {
  analysisYear: number;
  availableYears: number[];
  settlementYear: number;
  endYear: number;
  hasRun?: boolean;
  runStale?: boolean;
  coverage?: { hasTargetRoster: boolean; hasSchoolAge: boolean };
  onChange: (year: number) => void;
  onAddYear: (year: number) => void;
  showAddYear?: boolean;
  showYearMeta?: boolean;
  afterStatus?: ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(String(analysisYear + 1));
  const [error, setError] = useState<string | null>(null);
  const years = availableYears.length ? availableYears : [analysisYear];

  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <label className={FDB_TYPO.toolbarLabel}>분석연도</label>
          <select
            value={analysisYear}
            onChange={(e) => {
              setError(null);
              onChange(Number(e.target.value));
            }}
            className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>

        <span
          className={`rounded-md border px-2 py-0.5 ${FDB_TYPO.legend} ${
            hasRun
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-border bg-surface-2 text-muted"
          }`}
        >
          {hasRun
            ? runStale
              ? "분석결과 있음 · 가정 변경"
              : "분석결과 있음"
            : "분석결과 없음"}
        </span>

        {showYearMeta ? (
          <span className={FDB_TYPO.legend}>
            결산 {settlementYear}년 · 알리미·학령 {analysisYear}년 · 전망 {endYear}년
          </span>
        ) : null}

        {coverage && (!coverage.hasTargetRoster || !coverage.hasSchoolAge) ? (
          <span className={`${FDB_TYPO.legend} font-medium text-accent-orange`}>
            {!coverage.hasTargetRoster ? "대상대학 명부 없음" : "학령인구 탭 없음"}
          </span>
        ) : null}

        {afterStatus}

        {showAddYear && !adding ? (
          <button
            type="button"
            onClick={() => {
              setDraft(String(Math.max(...years) + 1));
              setAdding(true);
              setError(null);
            }}
            className={`ml-auto ${FDB_TYPO.legend} text-accent hover:underline`}
          >
            + 연도 추가
          </button>
        ) : showAddYear ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={2000}
              max={2100}
              placeholder="예: 2026"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-[30px] w-28 rounded-md border border-border bg-surface-2 px-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const year = Number(draft);
                if (!isFpAnalysisYear(year)) {
                  setError("2000~2100 사이의 연도를 입력하세요.");
                  return;
                }
                if (years.includes(year)) {
                  setError("이미 목록에 있는 연도입니다. 위 선택 목록에서 고르세요.");
                  return;
                }
                setError(null);
                onAddYear(year);
                setAdding(false);
              }}
              className={`h-[30px] rounded-md bg-accent px-3 text-white hover:opacity-90 ${FDB_TYPO.toolbarControl}`}
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className={`${FDB_TYPO.legend} text-muted hover:text-foreground`}
            >
              취소
            </button>
          </div>
        ) : null}
      </div>

      {showAddYear && adding ? (
        <p className={`mt-2 ${FDB_TYPO.legend}`}>
          현재 분석연도의 선정 지표·CPI·시나리오를 복사합니다. 대상대학은 분석대상
          대표학교에서 해당 연도 목록을 불러옵니다.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </section>
  );
}
