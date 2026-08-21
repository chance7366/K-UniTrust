import { parseIndicatorYearLabel } from "@/lib/competitiveness-analysis/parse-indicator-year";
import type { NationalComparisonScope } from "@/lib/competitiveness-analysis/analysis-policy";

export type NationalDistribution = {
  university: number[];
  juniorCollege: number[];
};

export type NationalDistributionMap = Map<string, NationalDistribution>;

function num(v: string | undefined | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function bucketCsvSchoolKind(
  kind: string,
): keyof Omit<NationalDistribution, never> | null {
  const k = kind.trim();
  if (k.includes("전문대")) return "juniorCollege";
  if (k.includes("대학")) return "university";
  return null;
}

function emptyDist(): NationalDistribution {
  return { university: [], juniorCollege: [] };
}

function pushValue(
  dist: NationalDistribution,
  kind: string,
  value: number,
): void {
  const bucket = bucketCsvSchoolKind(kind);
  if (!bucket) return;
  dist[bucket].push(value);
}

export function getNationalValuesForSchool(
  dist: NationalDistribution | undefined,
  schoolKind: string,
): number[] {
  if (!dist) return [];
  const cls = bucketCsvSchoolKind(schoolKind);
  if (cls === "juniorCollege") return dist.juniorCollege;
  return dist.university;
}

export function getNationalValuesForScope(
  dist: NationalDistribution | undefined,
  schoolKind: string,
  scope: NationalComparisonScope,
): number[] {
  if (!dist) return [];
  if (scope === "all-schools") {
    return [...dist.university, ...dist.juniorCollege];
  }
  return getNationalValuesForSchool(dist, schoolKind);
}

export function buildStdFieldNationalDist(
  rows: Record<string, string>[],
  year: number,
  valueField: string,
): NationalDistribution {
  const dist = emptyDist();
  for (const row of rows) {
    const y = num(row.year);
    const value = num(row[valueField]);
    if (y !== year || value == null) continue;
    const cohort = row.cohort?.trim() ?? "";
    const studentField =
      valueField === "fill_rate_within_outside" ||
      valueField === "enrolled_dropout_rate";
    if (cohort === "junior-college") {
      dist.juniorCollege.push(value);
      continue;
    }
    if (studentField) {
      if (cohort === "combined") dist.university.push(value);
      continue;
    }
    if (cohort === "university") {
      dist.university.push(value);
      continue;
    }
    pushValue(
      dist,
      row.school_kind ?? row.school_division ?? "",
      value,
    );
  }
  return dist;
}

export function buildNationalDistributionForIndicator(
  financeTabId: string,
  yearLabel: string,
  sources: {
    freshmanRows: Record<string, string>[];
    enrolledRows: Record<string, string>[];
    dropoutRows: Record<string, string>[];
    fundSecureRolled: Record<string, string>[];
    tuitionRolled: Record<string, string>[];
    financialSupportRolled: Record<string, string>[];
    incomePropertyRolled: Record<string, string>[];
    corpTransferRolled: Record<string, string>[];
    tuitionByPriorYear: Map<string, number>;
  },
): NationalDistribution {
  const parsed = parseIndicatorYearLabel(yearLabel);
  if (!parsed) return emptyDist();
  const { year } = parsed;

  switch (financeTabId) {
    case "freshman-enrollment-rate":
      return buildStdFieldNationalDist(
        sources.freshmanRows,
        year,
        "fill_rate_within_outside",
      );
    case "enrolled-enrollment-rate":
      return buildStdFieldNationalDist(
        sources.enrolledRows,
        year,
        "fill_rate_within_outside",
      );
    case "dropout-rate":
      return buildStdFieldNationalDist(
        sources.dropoutRows,
        year,
        "enrolled_dropout_rate",
      );
    case "fund-secure-rate":
      return buildStdFieldNationalDist(
        sources.fundSecureRolled,
        year,
        "fund_secure_rate",
      );
    case "financial-support-benefit-rate":
      return buildStdFieldNationalDist(
        sources.financialSupportRolled,
        year,
        "benefit_rate",
      );
    case "tuition-dependency-rate":
      return buildStdFieldNationalDist(
        sources.tuitionRolled,
        year,
        "tuition_dependency_rate",
      );
    case "income-property-secure-rate":
      return buildStdFieldNationalDist(
        sources.incomePropertyRolled,
        year,
        "secure_rate",
      );
    case "corp-transfer-ratio":
      return buildStdFieldNationalDist(
        sources.corpTransferRolled,
        year,
        "transfer_ratio",
      );
    default:
      return emptyDist();
  }
}

export function buildAllNationalDistributions(
  indicatorIds: string[],
  indicatorYears: Record<string, string>,
  defaultYears: Record<string, string>,
  sources: Parameters<typeof buildNationalDistributionForIndicator>[2],
): NationalDistributionMap {
  const map: NationalDistributionMap = new Map();
  for (const id of indicatorIds) {
    const yearLabel = indicatorYears[id] ?? defaultYears[id] ?? "";
    map.set(
      id,
      buildNationalDistributionForIndicator(id, yearLabel, sources),
    );
  }
  return map;
}
