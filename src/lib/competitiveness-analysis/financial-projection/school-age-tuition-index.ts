import type { SchoolAgePopulationRow } from "@/lib/data/school-age-population";
import {
  SCHOOL_AGE_BASELINE_AGE,
  SCHOOL_AGE_FUTURE_AGES,
  admissionYearFromAge,
  schoolAgeKey,
  type SchoolAgeAge,
} from "@/lib/ingest/school-age-population-config";
import type { SchoolAgeDeclinePoint } from "@/lib/competitiveness-analysis/financial-projection/types";
import {
  FP_DEFAULT_ANALYSIS_YEAR,
  projectionEndYearOf,
} from "@/lib/competitiveness-analysis/financial-projection/years";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function ageCount(
  ages: Record<string, number | null | undefined>,
  age: SchoolAgeAge,
): number {
  return ages[schoolAgeKey(age)] ?? 0;
}

/**
 * 자료연도 탭의 연령 → 대입연도 학령인구 감소 지수.
 * 2025년 탭 18세 = 2026년 대입 자원(지수 100).
 * 입학자원가중치(수능지원자/17세)를 곱한 입학자원으로 지수를 산출한다.
 * 시도 단위에서는 가중치가 연도 공통 스칼라이므로 지수 비율은 인원비와 같다.
 * 전국 지수는 시도별 (인원×가중치) 합산이라 가중치가 지수에 반영된다.
 */
export function buildSchoolAgeDeclineSeriesFromAges(args: {
  ages: Record<string, number | null | undefined>;
  admissionWeight: number | null;
  dataYear: number;
  analysisYear?: number;
  endYear?: number;
}): SchoolAgeDeclinePoint[] {
  const dataYear = args.dataYear;
  const analysisYear = args.analysisYear ?? dataYear ?? FP_DEFAULT_ANALYSIS_YEAR;
  const endYear = args.endYear ?? projectionEndYearOf(analysisYear);
  const weight =
    args.admissionWeight != null && args.admissionWeight > 0
      ? args.admissionWeight
      : 1;
  const baselineCount = ageCount(args.ages, SCHOOL_AGE_BASELINE_AGE);
  const baselineResource = baselineCount * weight;
  const baselineYear = admissionYearFromAge(dataYear, SCHOOL_AGE_BASELINE_AGE);

  const byYear = new Map<number, SchoolAgeDeclinePoint>();
  for (const age of SCHOOL_AGE_FUTURE_AGES) {
    const year = admissionYearFromAge(dataYear, age);
    const count = ageCount(args.ages, age);
    const weightedResource = count * weight;
    byYear.set(year, {
      year,
      age,
      count,
      admissionWeight: weight,
      weightedResource,
      index:
        baselineResource > 0
          ? round1((weightedResource / baselineResource) * 100)
          : 0,
    });
  }

  const last = [...byYear.values()].sort((a, b) => a.year - b.year).at(-1);
  const out: SchoolAgeDeclinePoint[] = [];
  for (let year = analysisYear; year <= endYear; year += 1) {
    if (year < baselineYear) {
      const baseline = byYear.get(baselineYear);
      out.push({
        year,
        age: null,
        count: baseline?.count ?? baselineCount,
        admissionWeight: weight,
        weightedResource: baseline?.weightedResource ?? baselineResource,
        index: 100,
      });
      continue;
    }
    const point = byYear.get(year);
    if (point) {
      out.push(point);
      continue;
    }
    if (last) {
      out.push({ ...last, year, age: last.age });
    }
  }
  return out;
}

export function pickSchoolAgeSidoRow(
  rows: SchoolAgePopulationRow[],
  region: string,
): SchoolAgePopulationRow | undefined {
  const key = region.trim();
  if (!key) return rows.find((row) => row.region === "전국");
  return (
    rows.find((row) => row.region === key) ??
    rows.find((row) => row.regionFull === key) ??
    rows.find((row) => row.regionFull.startsWith(key)) ??
    rows.find((row) => row.region === "전국")
  );
}

export function buildSidoSchoolAgeDeclineSeries(
  rows: SchoolAgePopulationRow[],
  region: string,
  dataYear: number,
  endYear?: number,
): SchoolAgeDeclinePoint[] {
  const horizon = endYear ?? projectionEndYearOf(dataYear);
  const row = pickSchoolAgeSidoRow(rows, region);
  const cell = row?.byYear[dataYear];
  if (!cell) {
    return buildSchoolAgeDeclineSeriesFromAges({
      ages: {},
      admissionWeight: 1,
      dataYear,
      analysisYear: dataYear,
      endYear: horizon,
    });
  }
  return buildSchoolAgeDeclineSeriesFromAges({
    ages: cell.ages,
    admissionWeight: cell.admissionWeight,
    dataYear,
    analysisYear: dataYear,
    endYear: horizon,
  });
}

/** 전국 = 시도별 (인원 × 입학자원가중치) 합산 */
export function buildNationalWeightedSchoolAgeDeclineSeries(
  rows: SchoolAgePopulationRow[],
  dataYear: number,
  endYear?: number,
): SchoolAgeDeclinePoint[] {
  const horizon = endYear ?? projectionEndYearOf(dataYear);
  const sidoRows = rows.filter((row) => row.region !== "전국");
  const ages: Record<string, number> = {};
  let weightSum = 0;
  let weightN = 0;
  for (const age of SCHOOL_AGE_FUTURE_AGES) {
    let resource = 0;
    let count = 0;
    for (const row of sidoRows) {
      const cell = row.byYear[dataYear];
      if (!cell) continue;
      const w =
        cell.admissionWeight != null && cell.admissionWeight > 0
          ? cell.admissionWeight
          : 1;
      const n = cell.ages[schoolAgeKey(age)] ?? 0;
      count += n;
      resource += n * w;
      if (age === SCHOOL_AGE_BASELINE_AGE) {
        weightSum += w;
        weightN += 1;
      }
    }
    ages[schoolAgeKey(age)] = resource;
  }
  const avgWeight = weightN > 0 ? weightSum / weightN : 1;
  return buildSchoolAgeDeclineSeriesFromAges({
    ages,
    admissionWeight: 1,
    dataYear,
    analysisYear: dataYear,
    endYear: horizon,
  }).map((point) => ({
    ...point,
    admissionWeight: round1(avgWeight),
    count:
      point.age != null
        ? sidoRows.reduce((sum, row) => {
            const n = row.byYear[dataYear]?.ages[schoolAgeKey(point.age as SchoolAgeAge)] ?? 0;
            return sum + n;
          }, 0)
        : point.count,
  }));
}

const schoolAgeIndexCache = new WeakMap<
  SchoolAgeDeclinePoint[],
  { byYear: Map<number, number>; lastYear: number; lastIndex: number }
>();

export function schoolAgeIndexAtYear(
  series: SchoolAgeDeclinePoint[] | undefined,
  year: number,
): number | null {
  if (!series?.length) return null;
  let cached = schoolAgeIndexCache.get(series);
  if (!cached) {
    const byYear = new Map<number, number>();
    for (const row of series) byYear.set(row.year, row.index);
    const last = series[series.length - 1]!;
    cached = { byYear, lastYear: last.year, lastIndex: last.index };
    schoolAgeIndexCache.set(series, cached);
  }
  const hit = cached.byYear.get(year);
  if (hit != null) return hit;
  return year > cached.lastYear ? cached.lastIndex : null;
}
