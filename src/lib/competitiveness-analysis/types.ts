import type { CompetitivenessFinanceGroupId } from "@/lib/analysis/competitiveness-indicators";
import type { AnalysisPolicy } from "@/lib/competitiveness-analysis/analysis-policy";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";

export type RawIndicatorCell = {
  financeTabId: string;
  label: string;
  yearLabel: string;
  rawValue: number | null;
  found: boolean;
  note?: string;
};

export type UniversityRawResult = {
  schoolCodeStd: string;
  schoolName: string;
  estb: string;
  schoolKind: string;
  region: string;
  enrolledTotal?: number | null;
  indicators: RawIndicatorCell[];
};

export type IndicatorRunCell = {
  financeTabId: string;
  label: string;
  rawValue: number;
  indexScore: number;
  rank: number;
  /** DB 원값 없음 또는 동종 전국 분포 부재 — 0점과 구분 */
  dataMissing?: boolean;
};

export type UniversityRunResult = {
  schoolCodeStd: string;
  schoolName: string;
  estb: string;
  schoolKind: string;
  region: string;
  indicators: IndicatorRunCell[];
  compositeIndex: number;
  compositeRank: number;
  absoluteLabels: string[];
  excludedFromRanking: boolean;
};

export type CompetitivenessSettings = {
  targetUniversities: TargetUniversityRow[];
  categoryWeights: Record<CompetitivenessFinanceGroupId, number>;
  indicatorWeights: Record<string, number>;
  enabledIndicators: Record<string, boolean>;
  indicatorYears: Record<string, string>;
  /** 지표별 하위 n% (Pₙ) — 기본 10 */
  indicatorPercentileLowerTailPct: Record<string, number>;
  /** 지표별 상위 n% (P₍₁₀₀₋ₙ₎) — 기본 10 */
  indicatorPercentileUpperTailPct: Record<string, number>;
  analysisPolicy: AnalysisPolicy;
};

export type CompetitivenessRunPayload = {
  rawResults: UniversityRawResult[];
  runResults: UniversityRunResult[];
  lastRunAt: string;
};
