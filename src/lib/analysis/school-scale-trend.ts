import { normalizeSchoolCodeText } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import {
  schoolScaleFromEnrolled,
  type SchoolScaleLabel,
} from "@/lib/competitiveness-analysis/school-scale";
import { classifyTargetSchoolKind } from "@/lib/competitiveness-analysis/step1-indicators";

export const SCALE_ORDER = ["대규모", "중규모", "소규모"] as const;

export type { SchoolScaleLabel };

export type EnrolledScaleLookupJson = {
  [year: string]: {
    university: Record<string, number>;
    juniorCollege: Record<string, number>;
  };
};

export type ScaleTrendPoint = {
  year: string;
  대규모: number | null;
  중규모: number | null;
  소규모: number | null;
};

export type ScaleTrendRow = {
  year: number;
  schoolCodeStd: string;
  schoolKind: string;
  schoolDivision: string;
};

/** 기본설정·3단계와 동일: 학교종류 → 학교구분 순으로 전문대 여부 판정 */
export function scaleKindFromRow(
  schoolKind: string,
  schoolDivision: string,
): "4년제" | "전문대" {
  if (
    classifyTargetSchoolKind(schoolKind) === "junior-college" ||
    classifyTargetSchoolKind(schoolDivision) === "junior-college"
  ) {
    return "전문대";
  }
  return "4년제";
}

export function lookupEnrolledForScaleRow(
  lookup: EnrolledScaleLookupJson,
  row: ScaleTrendRow,
): number | null {
  const yearMaps = lookup[String(row.year)];
  if (!yearMaps) return null;
  const code = normalizeSchoolCodeText(row.schoolCodeStd);
  if (!code) return null;
  const kind = scaleKindFromRow(row.schoolKind, row.schoolDivision);
  const value =
    kind === "전문대"
      ? yearMaps.juniorCollege[code]
      : yearMaps.university[code];
  return value == null ? null : value;
}

export function scaleForChartRow(
  lookup: EnrolledScaleLookupJson,
  row: ScaleTrendRow,
): SchoolScaleLabel | null {
  return schoolScaleFromEnrolled(
    lookupEnrolledForScaleRow(lookup, row),
    scaleKindFromRow(row.schoolKind, row.schoolDivision),
  );
}

export type ScaleAggregate = {
  region: SchoolScaleLabel;
  avgRate: number | null;
  yoy: number | null;
  schoolCount: number;
  riskCount: number;
  median: number | null;
};

export function arithmeticMeanRate(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function medianRate(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export function buildScaleAggregatePoints<T extends ScaleTrendRow>(
  current: T[],
  previous: T[],
  lookup: EnrolledScaleLookupJson,
  avgRate: (rows: T[]) => number | null,
  getRate: (row: T) => number,
  isRisk: (row: T) => boolean,
): ScaleAggregate[] {
  return SCALE_ORDER.map((scale) => {
    const curr = current.filter((r) => scaleForChartRow(lookup, r) === scale);
    const prev = previous.filter((r) => scaleForChartRow(lookup, r) === scale);
    const avg = avgRate(curr);
    const prevAvg = avgRate(prev);
    return {
      region: scale,
      avgRate: avg,
      yoy:
        avg != null && prevAvg != null
          ? Math.round((avg - prevAvg) * 10) / 10
          : null,
      schoolCount: curr.length,
      riskCount: curr.filter(isRisk).length,
      median: medianRate(curr.map(getRate)),
    };
  });
}

export const SCALE_COMPARE_HELP = {
  title: "학생 규모 비교",
  body: "재학생수는 대학현황 › 대학알리미 › 재적학생의 재학생(A) 계·소계를 대표학교코드로 합산합니다(대학=대학전문+대학원, 전문대학=대학전문). 규모는 대학경쟁력분석 3단계와 같습니다. 대학은 10,000명 이상 대규모·5,000명 이상 중규모, 전문대학은 4,000명 이상 대규모·2,000명 이상 중규모입니다. 규모별 가중 평균과 전년 대비 증감(%p)을 표시합니다.",
} as const;

export function buildScaleTrendPoints<T extends ScaleTrendRow>(
  rows: T[],
  years: number[],
  lookup: EnrolledScaleLookupJson,
  avgRate: (group: T[]) => number | null,
): ScaleTrendPoint[] {
  return years.map((year) => {
    const yearRows = rows.filter((r) => r.year === year);
    const point: ScaleTrendPoint = {
      year: String(year),
      대규모: null,
      중규모: null,
      소규모: null,
    };
    for (const scale of SCALE_ORDER) {
      const group = yearRows.filter((r) => scaleForChartRow(lookup, r) === scale);
      point[scale] = avgRate(group);
    }
    return point;
  });
}
