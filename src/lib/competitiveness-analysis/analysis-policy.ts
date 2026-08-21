import type { CompetitivenessIndicatorDef } from "@/lib/analysis/competitiveness-indicators";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";
import {
  STEP1_INDICATOR_IDS,
} from "@/lib/competitiveness-analysis/step1-indicators";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

/** 전국 백분위 비교 범위 */
export type NationalComparisonScope = "same-school-kind" | "all-schools";

/** 1·2단계에 사용할 지표 범위 */
export type StepIndicatorScope = "enabled-only" | "all-catalog";

/** 절대지표 해당 대학 처리 */
export type AbsoluteIndicatorPolicy = "include-with-notes" | "exclude-from-ranking";

export type AnalysisPolicy = {
  nationalComparisonScope: NationalComparisonScope;
  step12IndicatorScope: StepIndicatorScope;
  lowerIsBetterIndicatorIds: string[];
  absoluteIndicatorPolicy: AbsoluteIndicatorPolicy;
};

export const DEFAULT_LOWER_IS_BETTER_INDICATOR_IDS = [
  "dropout-rate",
  "tuition-dependency-rate",
] as const;

export const DEFAULT_ANALYSIS_POLICY: AnalysisPolicy = {
  nationalComparisonScope: "same-school-kind",
  step12IndicatorScope: "enabled-only",
  lowerIsBetterIndicatorIds: [...DEFAULT_LOWER_IS_BETTER_INDICATOR_IDS],
  absoluteIndicatorPolicy: "include-with-notes",
};

export function resolveAnalysisPolicy(
  settings: CompetitivenessSettings,
): AnalysisPolicy {
  const stored = settings.analysisPolicy;
  return {
    ...DEFAULT_ANALYSIS_POLICY,
    ...stored,
    lowerIsBetterIndicatorIds:
      stored?.lowerIsBetterIndicatorIds?.length
        ? stored.lowerIsBetterIndicatorIds
        : DEFAULT_ANALYSIS_POLICY.lowerIsBetterIndicatorIds,
  };
}

export function resolveLowerIsBetterSet(policy: AnalysisPolicy): Set<string> {
  return new Set(policy.lowerIsBetterIndicatorIds);
}

/** 3단계 종합지수에 사용할 지표 (기본설정 적용지표) */
export function resolveStep3IndicatorIds(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): string[] {
  return indicators
    .filter((ind) => settings.enabledIndicators[ind.financeTabId] !== false)
    .map((ind) => ind.financeTabId);
}

/** 1·2단계 지표 ID — 분석지침 정책 반영 */
export function resolveStep12IndicatorIds(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): string[] {
  const policy = resolveAnalysisPolicy(settings);
  if (policy.step12IndicatorScope === "all-catalog") {
    return [...STEP1_INDICATOR_IDS];
  }
  return resolveStep3IndicatorIds(settings, indicators);
}

export function absoluteLabelsFor(u: TargetUniversityRow): string[] {
  const labels: string[] = [];
  if (u.studentAidRestrict === "해당" || u.crisis === "해당") {
    labels.push("학자금제한");
  }
  if (u.provisionalBoard === "해당") labels.push("임시이사");
  if (u.noSettlement === "해당" || u.noAccreditation === "해당") {
    labels.push("결산미제출");
  }
  if (u.fundShortage === "해당") labels.push("자금부족");
  return labels;
}

export function hasAbsoluteFlag(u: TargetUniversityRow): boolean {
  return absoluteLabelsFor(u).length > 0;
}

export function isExcludedFromRanking(
  u: TargetUniversityRow,
  policy: AnalysisPolicy,
): boolean {
  return (
    policy.absoluteIndicatorPolicy === "exclude-from-ranking" &&
    hasAbsoluteFlag(u)
  );
}

export const NATIONAL_COMPARISON_SCOPE_LABELS: Record<
  NationalComparisonScope,
  string
> = {
  "same-school-kind": "동종(대학/전문대학) 분리",
  "all-schools": "전체 통합",
};

export const STEP_INDICATOR_SCOPE_LABELS: Record<StepIndicatorScope, string> = {
  "enabled-only": "기본설정 적용지표만",
  "all-catalog": "전체 8개 지표",
};

export const ABSOLUTE_INDICATOR_POLICY_LABELS: Record<
  AbsoluteIndicatorPolicy,
  string
> = {
  "include-with-notes": "순위 포함 · 비고 표시",
  "exclude-from-ranking": "순위 제외 · 비고 표시",
};
