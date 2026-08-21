import {
  highRiskThresholdRank,
  type AnalyticsGrade,
} from "@/lib/competitiveness-analysis/diagnostic-grade";
import { REPORT_INDICATOR_CATALOG } from "@/lib/competitiveness-analysis/university-report/generation-guidelines";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";
import type {
  GroupIndexYearRow,
  IndicatorYearRow,
} from "@/lib/competitiveness-analysis/university-detail-data";

export type IndicatorStatus = "danger" | "warning" | "success" | "neutral";

export type MomentumLabel = "surge" | "drop" | "flat";

export type StrategicQuadrantId =
  | "leader"
  | "fiscal-cushion"
  | "enrollment-strong"
  | "compound-crisis";

export const STRATEGIC_QUADRANT_LABELS: Record<
  StrategicQuadrantId,
  { label: string; desc: string }
> = {
  leader: { label: "지속가능 선도형", desc: "충원·재정 모두 상위" },
  "fiscal-cushion": { label: "재정완충 위기형", desc: "재정 양호·충원 취약" },
  "enrollment-strong": {
    label: "충원우수 재정취약형",
    desc: "충원 양호·재정 취약",
  },
  "compound-crisis": {
    label: "복합 구조위기형",
    desc: "충원·재정 모두 하위",
  },
};

export type IndicatorV2Card = {
  indicatorId: string;
  indicatorLabel: string;
  categoryId: string;
  categoryLabel: string;
  direction: "positive" | "negative";
  indexScore: number | null;
  rawValue: number | null;
  rank: number | null;
  nationalGap: number | null;
  nationalIndexAvg: number | null;
  momentum3y: number | null;
  momentumLabel: MomentumLabel;
  status: IndicatorStatus;
  sparkline: number[];
  dataMissing: boolean;
};

export type UniversityV2Analytics = {
  balanceIndex: number | null;
  studentSectorScore: number | null;
  univFinanceScore: number | null;
  corpFinanceScore: number | null;
  financeHealthScore: number | null;
  strategicQuadrant: StrategicQuadrantId;
  strategicQuadrantLabel: string;
  highRiskIndicatorCount: number;
  strengthIndicator: IndicatorV2Card | null;
  weakestIndicator: IndicatorV2Card | null;
  strengthIndicatorCount: number;
  indicatorCards: IndicatorV2Card[];
  radarSchool: { indicatorId: string; label: string; value: number }[];
  radarNational: { indicatorId: string; label: string; value: number }[];
  oneLineSummary: string;
  shortTermTasks: string[];
  midLongTermTasks: string[];
};

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const mean = avg(nums)!;
  const variance =
    nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

export function computeBalanceIndex(scores: number[]): number | null {
  const valid = scores.filter((v) => Number.isFinite(v));
  if (valid.length < 2) return null;
  return stdDev(valid);
}

export function computeFinanceHealthScore(
  univFinance: number | null,
  corpFinance: number | null,
  settings?: CompetitivenessSettings,
): number | null {
  if (univFinance == null && corpFinance == null) return null;
  const uw = settings?.categoryWeights?.["univ-finance"] ?? 40;
  const cw = settings?.categoryWeights?.["corp-finance"] ?? 10;
  const total = uw + cw;
  const u = univFinance ?? 0;
  const c = corpFinance ?? 0;
  return (u * uw + c * cw) / total;
}

export function resolveStrategicQuadrant(
  studentScore: number | null,
  financeHealth: number | null,
  midline = 50,
): StrategicQuadrantId {
  const x = studentScore ?? 0;
  const y = financeHealth ?? 0;
  const highX = x >= midline;
  const highY = y >= midline;
  if (highX && highY) return "leader";
  if (!highX && highY) return "fiscal-cushion";
  if (highX && !highY) return "enrollment-strong";
  return "compound-crisis";
}

const IMPROVEMENT_LEVER_STATUS_ORDER: Record<IndicatorStatus, number> = {
  danger: 0,
  warning: 1,
  neutral: 2,
  success: 3,
};

/** Decision Insight · What-If 정적 패널 — 우선 개선 레버(최대 limit개) */
export function selectImprovementLevers(
  cards: IndicatorV2Card[],
  limit = 3,
): IndicatorV2Card[] {
  return cards
    .filter((c) => !c.dataMissing && c.status !== "success")
    .sort((a, b) => {
      const statusDiff =
        IMPROVEMENT_LEVER_STATUS_ORDER[a.status] -
        IMPROVEMENT_LEVER_STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;

      const gapA = a.nationalGap ?? 0;
      const gapB = b.nationalGap ?? 0;
      if (gapA !== gapB) return gapA - gapB;

      return (b.rank ?? 0) - (a.rank ?? 0);
    })
    .slice(0, limit);
}

export function indicatorStatusFromRankAndGap(
  rank: number | null,
  cohortSize: number,
  nationalGap: number | null,
): IndicatorStatus {
  if (rank != null && cohortSize > 0) {
    const threshold = highRiskThresholdRank(cohortSize);
    if (rank >= threshold) return "danger";
    if (rank <= Math.ceil(cohortSize * 0.25)) return "success";
  }
  if (nationalGap != null) {
    if (nationalGap <= -20) return "danger";
    if (nationalGap <= -10) return "warning";
    if (nationalGap >= 10) return "success";
  }
  return "neutral";
}

export function computeMomentum3y(
  yearRows: IndicatorYearRow[],
  analysisYear: number,
): { delta: number | null; label: MomentumLabel } {
  const sorted = [...yearRows]
    .filter((r) => !r.dataMissing && r.indexScore != null)
    .sort((a, b) => a.analysisYear - b.analysisYear);
  const current = sorted.find((r) => r.analysisYear === analysisYear);
  const baseline = sorted.find((r) => r.analysisYear === analysisYear - 3);
  if (current?.indexScore == null || baseline?.indexScore == null) {
    const lastTwo = sorted.slice(-2);
    if (lastTwo.length === 2 && lastTwo[0].indexScore != null && lastTwo[1].indexScore != null) {
      const d = lastTwo[1].indexScore! - lastTwo[0].indexScore!;
      return { delta: d, label: momentumLabelFromDelta(d) };
    }
    return { delta: null, label: "flat" };
  }
  const delta = current!.indexScore! - baseline!.indexScore!;
  return { delta, label: momentumLabelFromDelta(delta) };
}

function momentumLabelFromDelta(delta: number): MomentumLabel {
  if (delta <= -10) return "drop";
  if (delta >= 10) return "surge";
  return "flat";
}

function buildOneLineSummary(args: {
  schoolName: string;
  analysisYear: number;
  compositeIndex: number | null;
  diagnosticGrade: string;
  quadrantLabel: string;
  highRiskCount: number;
  weakestLabel: string | null;
}): string {
  const parts = [
    `${args.schoolName}은 ${args.analysisYear}년 종합지수 ${args.compositeIndex?.toFixed(1) ?? "—"}점·${args.diagnosticGrade}등급·${args.quadrantLabel} 구간입니다.`,
  ];
  if (args.highRiskCount > 0) {
    parts.push(
      `동종 하위 7% 고위험 지표 ${args.highRiskCount}개${args.weakestLabel ? `(핵심: ${args.weakestLabel})` : ""}가 확인됩니다.`,
    );
  }
  return parts.join(" ");
}

function taskLabelForLever(card: IndicatorV2Card): string {
  if (
    card.categoryId === "student-enrollment" ||
    card.indicatorId.includes("freshman") ||
    card.indicatorId.includes("enrolled") ||
    card.indicatorId.includes("dropout")
  ) {
    return `${card.indicatorLabel} 개선 — 모집·유지 전략 점검`;
  }
  if (card.categoryId === "univ-finance") {
    return `${card.indicatorLabel} — 재정지원·자금조달 단기 대응`;
  }
  return `${card.indicatorLabel} — 법인재정·전입 구조 개선`;
}

function quadrantLeadTask(quadrant: StrategicQuadrantId): string {
  switch (quadrant) {
    case "compound-crisis":
      return "복합 구조위기 — 충원·재정 동시 점검 TF 구성";
    case "fiscal-cushion":
      return "재정완충·충원위기 — 수시·정원 관리 및 중도이탈 케어 강화";
    case "enrollment-strong":
      return "충원우수·재정취약 — 법인재정·등록금 의존 구조 점검 TF 구성";
    default:
      return "선도형 유지 — 고위험·열위 지표 선제 모니터링";
  }
}

function quadrantMidTask(quadrant: StrategicQuadrantId): string {
  switch (quadrant) {
    case "compound-crisis":
      return "전공·학과 구조조정 및 중장기 재정 건전성 로드맵 수립";
    case "enrollment-strong":
      return "법인재정·수익용재산 기반 중장기 재정 건전성 로드맵 수립";
    case "fiscal-cushion":
      return "충원·유지 역량 강화 및 중장기 학과·정원 구조 재편";
    default:
      return "중장기 과제 — 부문별 벤치마크 격차 축소 계획";
  }
}

function roadmapTasks(
  cards: IndicatorV2Card[],
  quadrant: StrategicQuadrantId,
): { shortTerm: string[]; midLong: string[] } {
  const shortTerm: string[] = [quadrantLeadTask(quadrant)];
  const midLong: string[] = [];
  const levers = selectImprovementLevers(cards, 3);

  for (const card of levers) {
    const task = taskLabelForLever(card);
    if (shortTerm.length < 3 && !shortTerm.includes(task)) {
      shortTerm.push(task);
    } else if (!midLong.includes(task)) {
      midLong.push(task);
    }
  }

  const midDefault = quadrantMidTask(quadrant);
  if (!midLong.includes(midDefault)) {
    midLong.push(midDefault);
  }

  if (shortTerm.length < 2) {
    shortTerm.push("단기 긴급 과제 — 우선 개선 지표 지속 모니터링");
  }

  return {
    shortTerm: [...new Set(shortTerm)].slice(0, 3),
    midLong: [...new Set(midLong)].slice(0, 2),
  };
}

export function buildUniversityV2Analytics(args: {
  analysisYear: number;
  schoolName: string;
  compositeIndex: number | null;
  diagnosticGrade: string;
  cohortSize: number;
  groupIndexRows: GroupIndexYearRow[];
  indicatorSummaryRows: {
    categoryId: string;
    categoryLabel: string;
    indicatorId: string;
    indicatorLabel: string;
    rawValue: number | null;
    indexScore: number | null;
    rank: number | null;
    dataMissing: boolean;
    nationalIndexAvg: number | null;
  }[];
  indicatorYearRowsById: Record<string, IndicatorYearRow[]>;
  settings?: CompetitivenessSettings;
}): UniversityV2Analytics {
  const currentGroup = args.groupIndexRows.find(
    (r) => r.analysisYear === args.analysisYear,
  );
  const student = currentGroup?.studentEnrollment ?? null;
  const univ = currentGroup?.univFinance ?? null;
  const corp = currentGroup?.corpFinance ?? null;
  const financeHealth = computeFinanceHealthScore(univ, corp, args.settings);
  const quadrant = resolveStrategicQuadrant(student, financeHealth);
  const quadrantMeta = STRATEGIC_QUADRANT_LABELS[quadrant];

  const indicatorCards: IndicatorV2Card[] = args.indicatorSummaryRows.map((row) => {
    const meta = REPORT_INDICATOR_CATALOG.find((i) => i.id === row.indicatorId);
    const yearRows = args.indicatorYearRowsById[row.indicatorId] ?? [];
    const nationalGap =
      row.indexScore != null && row.nationalIndexAvg != null
        ? row.indexScore - row.nationalIndexAvg
        : null;
    const { delta, label } = computeMomentum3y(yearRows, args.analysisYear);
    const sparkline = yearRows
      .filter((r) => !r.dataMissing && r.indexScore != null)
      .map((r) => r.indexScore as number);

    return {
      indicatorId: row.indicatorId,
      indicatorLabel: row.indicatorLabel,
      categoryId: row.categoryId,
      categoryLabel: row.categoryLabel,
      direction:
        meta?.direction === "negative" ? "negative" : "positive",
      indexScore: row.indexScore,
      rawValue: row.rawValue,
      rank: row.rank,
      nationalGap,
      nationalIndexAvg: row.nationalIndexAvg,
      momentum3y: delta,
      momentumLabel: label,
      status: indicatorStatusFromRankAndGap(
        row.rank,
        args.cohortSize,
        nationalGap,
      ),
      sparkline,
      dataMissing: row.dataMissing,
    };
  });

  const validScores = indicatorCards
    .map((c) => c.indexScore)
    .filter((v): v is number => v != null && Number.isFinite(v));

  const ranked = indicatorCards
    .filter((c) => !c.dataMissing && c.rank != null)
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  const strengthIndicator =
    ranked.find((c) => c.status === "success") ??
    ranked[0] ??
    null;
  const weakestIndicator = ranked[ranked.length - 1] ?? null;

  const strengthIndicatorCount = indicatorCards.filter(
    (c) => c.status === "success",
  ).length;

  const highRiskIndicatorCount = indicatorCards.filter(
    (c) => c.status === "danger",
  ).length;

  const radarSchool = indicatorCards.map((c) => ({
    indicatorId: c.indicatorId,
    label: c.indicatorLabel.replace(/율/g, ""),
    value: c.indexScore ?? 0,
  }));
  const radarNational = indicatorCards.map((c) => ({
    indicatorId: c.indicatorId,
    label: c.indicatorLabel.replace(/율/g, ""),
    value: c.nationalIndexAvg ?? 0,
  }));

  const { shortTerm, midLong } = roadmapTasks(indicatorCards, quadrant);

  return {
    balanceIndex: computeBalanceIndex(validScores),
    studentSectorScore: student,
    univFinanceScore: univ,
    corpFinanceScore: corp,
    financeHealthScore: financeHealth,
    strategicQuadrant: quadrant,
    strategicQuadrantLabel: quadrantMeta.label,
    highRiskIndicatorCount,
    strengthIndicator,
    weakestIndicator,
    strengthIndicatorCount,
    indicatorCards,
    radarSchool,
    radarNational,
    oneLineSummary: buildOneLineSummary({
      schoolName: args.schoolName,
      analysisYear: args.analysisYear,
      compositeIndex: args.compositeIndex,
      diagnosticGrade: args.diagnosticGrade,
      quadrantLabel: quadrantMeta.label,
      highRiskCount: highRiskIndicatorCount,
      weakestLabel: weakestIndicator?.indicatorLabel ?? null,
    }),
    shortTermTasks: shortTerm,
    midLongTermTasks: midLong,
  };
}

export function gradeFromLabel(label: string): AnalyticsGrade | null {
  const m = label.match(/^([SABCDE])/);
  return (m?.[1] as AnalyticsGrade) ?? null;
}
