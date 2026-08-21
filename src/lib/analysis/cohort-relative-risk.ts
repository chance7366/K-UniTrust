import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";

/** 동종(4년제/전문대) 내 상대 위험 — 경쟁력분석 1안 */
export const COHORT_RISK_TAIL_PCT = 15;
export const COHORT_HIGH_RISK_TAIL_PCT = 7;

export const COHORT_RISK_LABEL = "동종 하위 15%";
export const COHORT_HIGH_RISK_LABEL = "동종 하위 7%";
export const COHORT_TOP_LABEL = "동종 상위 15%";
export const COHORT_STAR_LABEL = "동종 상위 7%";
export const COHORT_RISK_LIST_SUBTITLE =
  `${COHORT_RISK_LABEL} 이하는 위험 · ${COHORT_HIGH_RISK_LABEL} 이하는 고위험 · 선택 지역 필터 반영`;

export type CohortBucket = "university" | "juniorCollege";

export type CohortThresholds = Map<
  CohortBucket,
  { risk: number; high: number; top15: number; top7: number }
>;

export type SchoolKindFields = {
  schoolKind: string;
  schoolDivision: string;
};

export function resolveCohortBucket(
  schoolKind: string,
  schoolDivision: string,
): CohortBucket {
  return resolveSchoolDivisionFromFields(schoolKind, schoolDivision) ===
    "전문대학"
    ? "juniorCollege"
    : "university";
}

export function cohortBucketFromRow(row: SchoolKindFields): CohortBucket {
  return resolveCohortBucket(row.schoolKind, row.schoolDivision);
}

/** 성과 점수 — 값이 클수록 우수 (지수·원천값 공통) */
export function toPerformanceScore(
  value: number,
  higherIsBetter: boolean,
): number {
  return higherIsBetter ? value : -value;
}

export function higherIsBetterFromRiskDirection(
  riskDirection?: "below" | "above",
): boolean {
  return riskDirection !== "above";
}

function percentileOfSorted(sortedAsc: number[], pct: number): number | null {
  if (!sortedAsc.length) return null;
  const idx = Math.floor((sortedAsc.length - 1) * (pct / 100));
  return sortedAsc[Math.max(0, idx)]!;
}

export function buildCohortThresholds(
  entries: { bucket: CohortBucket; performance: number }[],
): CohortThresholds {
  const byBucket = new Map<CohortBucket, number[]>();
  for (const entry of entries) {
    if (!byBucket.has(entry.bucket)) byBucket.set(entry.bucket, []);
    byBucket.get(entry.bucket)!.push(entry.performance);
  }

  const thresholds: CohortThresholds = new Map();
  for (const [bucket, perfs] of byBucket) {
    const sorted = [...perfs].sort((a, b) => a - b);
    const risk = percentileOfSorted(sorted, COHORT_RISK_TAIL_PCT);
    const high = percentileOfSorted(sorted, COHORT_HIGH_RISK_TAIL_PCT);
    const top15 = percentileOfSorted(sorted, 100 - COHORT_RISK_TAIL_PCT);
    const top7 = percentileOfSorted(sorted, 100 - COHORT_HIGH_RISK_TAIL_PCT);
    if (risk != null && high != null && top15 != null && top7 != null) {
      thresholds.set(bucket, { risk, high, top15, top7 });
    }
  }
  return thresholds;
}

export function isCohortRelativeRisk(
  performance: number,
  bucket: CohortBucket,
  thresholds: CohortThresholds,
  level: "risk" | "high",
): boolean {
  const t = thresholds.get(bucket);
  if (!t) return false;
  const cutoff = level === "high" ? t.high : t.risk;
  return performance <= cutoff;
}

export type CohortRiskCounts = {
  risk: number;
  highRisk: number;
  total: number;
  riskPct: number;
  highRiskPct: number;
};

export function countCohortRelativeRisk<T extends SchoolKindFields>(
  rows: T[],
  getRate: (row: T) => number,
  higherIsBetter: boolean,
): CohortRiskCounts {
  const enriched = rows.map((row) => ({
    bucket: cohortBucketFromRow(row),
    performance: toPerformanceScore(getRate(row), higherIsBetter),
  }));
  const thresholds = buildCohortThresholds(enriched);

  let risk = 0;
  let highRisk = 0;
  for (const entry of enriched) {
    if (isCohortRelativeRisk(entry.performance, entry.bucket, thresholds, "risk")) {
      risk++;
    }
    if (
      isCohortRelativeRisk(entry.performance, entry.bucket, thresholds, "high")
    ) {
      highRisk++;
    }
  }

  const total = rows.length;
  return {
    risk,
    highRisk,
    total,
    riskPct: total ? Math.round((risk / total) * 1000) / 10 : 0,
    highRiskPct: total ? Math.round((highRisk / total) * 1000) / 10 : 0,
  };
}

export function buildCohortRiskContext<T extends SchoolKindFields>(
  rows: T[],
  getRate: (row: T) => number,
  higherIsBetter: boolean,
): {
  thresholds: CohortThresholds;
  rowPerformance: (row: T) => number;
  rowBucket: (row: T) => CohortBucket;
} {
  const enriched = rows.map((row) => ({
    row,
    bucket: cohortBucketFromRow(row),
    performance: toPerformanceScore(getRate(row), higherIsBetter),
  }));
  const thresholds = buildCohortThresholds(
    enriched.map((e) => ({ bucket: e.bucket, performance: e.performance })),
  );
  return {
    thresholds,
    rowPerformance: (row) =>
      toPerformanceScore(getRate(row), higherIsBetter),
    rowBucket: cohortBucketFromRow,
  };
}

export function isRowCohortRelativeRisk<T extends SchoolKindFields>(
  row: T,
  context: ReturnType<typeof buildCohortRiskContext<T>>,
  level: "risk" | "high",
): boolean {
  return isCohortRelativeRisk(
    context.rowPerformance(row),
    context.rowBucket(row),
    context.thresholds,
    level,
  );
}

export const COHORT_RISK_KPI_HELP = {
  title: "위험군 대학 수",
  body:
    "동종(4년제·전문대학 각각) 내에서 해당 지표 성과가 하위 15%에 해당하는 대학 수입니다. " +
    "고위험은 동종 하위 7%입니다. " +
    "부제의 ‘선’은 그 구간에 해당하는 지표값(충원율·확보율 등)이며, 대학 수 비율이 아닙니다. " +
    "대학과 전문대학이 함께 있으면 동종별로 선을 따로 표시합니다.",
} as const;

const COHORT_BUCKET_LABEL: Record<CohortBucket, string> = {
  university: "대학",
  juniorCollege: "전문대",
};

export type CohortCutoffDisplay = {
  risk: string;
  high: string;
  top15: string;
  top7: string;
};

function formatCutoffRate(rate: number, digits: number): string {
  return `${rate.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/** 동종 하위·상위 15%/7% 컷오프를 원천 지표값(%)으로 표시 */
export function buildCohortCutoffDisplay<T extends SchoolKindFields>(
  rows: T[],
  getRate: (row: T) => number,
  higherIsBetter: boolean,
  digits = 1,
): CohortCutoffDisplay {
  const empty = { risk: "—", high: "—", top15: "—", top7: "—" };
  if (!rows.length) return empty;

  const ctx = buildCohortRiskContext(rows, getRate, higherIsBetter);
  const entries = [...ctx.thresholds.entries()];
  if (!entries.length) return empty;

  const toRate = (performance: number) =>
    higherIsBetter ? performance : -performance;

  const formatKey = (key: "risk" | "high" | "top15" | "top7") => {
    if (entries.length === 1) {
      return formatCutoffRate(toRate(entries[0][1][key]), digits);
    }
    return entries
      .map(
        ([bucket, t]) =>
          `${COHORT_BUCKET_LABEL[bucket]} ${formatCutoffRate(toRate(t[key]), digits)}`,
      )
      .join(" · ");
  };

  return {
    risk: formatKey("risk"),
    high: formatKey("high"),
    top15: formatKey("top15"),
    top7: formatKey("top7"),
  };
}

export function formatCohortRiskKpiSub(cutoffs: CohortCutoffDisplay): string {
  return `${COHORT_RISK_LABEL} 선 ${cutoffs.risk} · ${COHORT_HIGH_RISK_LABEL} 선 ${cutoffs.high}`;
}
