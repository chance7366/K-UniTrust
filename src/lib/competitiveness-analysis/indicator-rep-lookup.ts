import type { IndicatorSourceData } from "@/lib/competitiveness-analysis/indicator-value-loader";
import { classifyTargetSchoolKind } from "@/lib/competitiveness-analysis/step1-indicators";
import { STEP1_INDICATOR_LABELS } from "@/lib/competitiveness-analysis/step1-indicators";

const STUDENT_INDICATOR_IDS = new Set([
  "freshman-enrollment-rate",
  "enrolled-enrollment-rate",
  "dropout-rate",
]);

export type RepCohort = "university" | "junior-college" | "combined";

export type IndicatorRepSpec = {
  sourceKey: keyof Pick<
    IndicatorSourceData,
    | "freshmanRows"
    | "enrolledRows"
    | "dropoutRows"
    | "fundSecureRolled"
    | "financialSupportRolled"
    | "tuitionRolled"
    | "incomePropertyRolled"
    | "corpTransferRolled"
  >;
  valueField: string;
  isStudent: boolean;
};

/** 재정분석지표 *_rep.csv — 분석실행·검증이 같은 칼럼·코호트를 쓰는지 대조할 때 사용 */
export const INDICATOR_REP_SPEC: Record<string, IndicatorRepSpec> = {
  "freshman-enrollment-rate": {
    sourceKey: "freshmanRows",
    valueField: "fill_rate_within_outside",
    isStudent: true,
  },
  "enrolled-enrollment-rate": {
    sourceKey: "enrolledRows",
    valueField: "fill_rate_within_outside",
    isStudent: true,
  },
  "dropout-rate": {
    sourceKey: "dropoutRows",
    valueField: "enrolled_dropout_rate",
    isStudent: true,
  },
  "fund-secure-rate": {
    sourceKey: "fundSecureRolled",
    valueField: "fund_secure_rate",
    isStudent: false,
  },
  "financial-support-benefit-rate": {
    sourceKey: "financialSupportRolled",
    valueField: "benefit_rate",
    isStudent: false,
  },
  "tuition-dependency-rate": {
    sourceKey: "tuitionRolled",
    valueField: "tuition_dependency_rate",
    isStudent: false,
  },
  "income-property-secure-rate": {
    sourceKey: "incomePropertyRolled",
    valueField: "secure_rate",
    isStudent: false,
  },
  "corp-transfer-ratio": {
    sourceKey: "corpTransferRolled",
    valueField: "transfer_ratio",
    isStudent: false,
  },
};

export function padSchoolRepCode(value: string): string {
  const s = value.trim();
  if (!s) return "";
  return /^\d+$/.test(s) ? s.padStart(7, "0") : s;
}

export function parseRepNumber(value: string | undefined | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function classifyRepSchoolKind(
  schoolKind: string,
  schoolDivision: string,
): "university" | "junior-college" {
  const fromKind = classifyTargetSchoolKind(schoolKind);
  if (fromKind !== "other") return fromKind;
  return classifyTargetSchoolKind(schoolDivision) === "junior-college"
    ? "junior-college"
    : "university";
}

/** 대학 학생충원: combined → university, 대학 재정: university, 전문대: junior-college */
export function resolveRepLookupCohorts(
  financeTabId: string,
  schoolKind: string,
  schoolDivision: string,
): RepCohort[] {
  const kind = classifyRepSchoolKind(schoolKind, schoolDivision);
  if (kind === "junior-college") return ["junior-college"];
  if (STUDENT_INDICATOR_IDS.has(financeTabId)) {
    return ["combined", "university"];
  }
  return ["university"];
}

export function lookupRepValueFromRows(
  rows: Record<string, string>[],
  year: number,
  cohorts: RepCohort[],
  repCode: string,
  valueField: string,
): number | null {
  const code = padSchoolRepCode(repCode);
  if (!code) return null;
  for (const cohort of cohorts) {
    for (const row of rows) {
      if (parseRepNumber(row.year) !== year) continue;
      if ((row.cohort?.trim() ?? "") !== cohort) continue;
      if (padSchoolRepCode(row.school_rep_code ?? "") !== code) continue;
      const value = parseRepNumber(row[valueField]);
      if (value != null) return value;
    }
  }
  return null;
}

export function lookupExpectedIndicatorValue(
  sources: IndicatorSourceData,
  financeTabId: string,
  year: number,
  schoolKind: string,
  schoolDivision: string,
  schoolCodeStd: string,
): number | null {
  const spec = INDICATOR_REP_SPEC[financeTabId];
  if (!spec) return null;
  return lookupRepValueFromRows(
    sources[spec.sourceKey],
    year,
    resolveRepLookupCohorts(financeTabId, schoolKind, schoolDivision),
    schoolCodeStd,
    spec.valueField,
  );
}

export function lookupExpectedEnrolledTotal(
  sources: IndicatorSourceData,
  year: number,
  schoolKind: string,
  schoolDivision: string,
  schoolCodeStd: string,
): number | null {
  return lookupRepValueFromRows(
    sources.enrolledRows,
    year,
    resolveRepLookupCohorts(
      "enrolled-enrollment-rate",
      schoolKind,
      schoolDivision,
    ),
    schoolCodeStd,
    "enrolled_total",
  );
}

export function indicatorRepLabel(financeTabId: string): string {
  return (
    STEP1_INDICATOR_LABELS[
      financeTabId as keyof typeof STEP1_INDICATOR_LABELS
    ] ?? financeTabId
  );
}

export function valuesApproxEqual(
  a: number,
  b: number,
  tolerance = 0.051,
): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function countRepRowsByCohort(
  rows: Record<string, string>[],
  year: number,
): { university: number; juniorCollege: number; combined: number } {
  let university = 0;
  let juniorCollege = 0;
  let combined = 0;
  for (const row of rows) {
    if (parseRepNumber(row.year) !== year) continue;
    const cohort = row.cohort?.trim() ?? "";
    if (cohort === "junior-college") juniorCollege += 1;
    else if (cohort === "combined") combined += 1;
    else if (cohort === "university") university += 1;
  }
  return { university, juniorCollege, combined };
}
