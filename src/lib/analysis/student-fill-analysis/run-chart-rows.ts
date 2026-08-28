import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import { normalizeSchoolCodeText } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import type { FreshmanRepRow } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import type { EnrolledScaleLookupJson } from "@/lib/analysis/school-scale-trend";
import type { FreshmanChartMetric } from "@/lib/analysis/student-fill-advanced-chart-rows";

import type { StudentFillSchoolRow } from "./types";

export type StudentFillChartHistoryYear = {
  year: number;
  schools: StudentFillSchoolRow[];
};

function num(n: number | null | undefined): number {
  return n == null || !Number.isFinite(n) ? 0 : n;
}

export function toStudentFillRunChartRows(
  history: StudentFillChartHistoryYear[],
  metric: FreshmanChartMetric,
): CorpTransferRatioAdvancedRow[] {
  return history.flatMap(({ year, schools }) =>
    schools.map((row) => {
      if (metric === "withinOutside") {
        return {
          year,
          schoolCodeStd: row.schoolCodeStd,
          schoolName: row.schoolName,
          schoolDivision: row.schoolDivision,
          schoolKind: row.schoolKind,
          region: row.region,
          estb: row.estb,
          tuitionRevenue: num(row.recruitTotal),
          ordinaryExpenseTransfer: 0,
          legalObligationTransfer: num(row.recruitTotal),
          assetTransfer: num(row.admitTotal),
          totalTransfer: num(row.admitTotal),
          transferRatio: num(row.rateAll),
        };
      }
      return {
        year,
        schoolCodeStd: row.schoolCodeStd,
        schoolName: row.schoolName,
        schoolDivision: row.schoolDivision,
        schoolKind: row.schoolKind,
        region: row.region,
        estb: row.estb,
        tuitionRevenue: num(row.recruitWithin),
        ordinaryExpenseTransfer: 0,
        legalObligationTransfer: num(row.recruitTotal),
        assetTransfer: num(row.admitTotal),
        totalTransfer: num(row.admitWithin),
        transferRatio: num(row.rateIn),
      };
    }),
  );
}

export function toStudentFillFreshmanRepRows(
  history: StudentFillChartHistoryYear[],
): FreshmanRepRow[] {
  return history.flatMap(({ year, schools }) =>
    schools.map((row) => ({
      year,
      schoolRepCode: row.schoolCodeStd,
      schoolRepName: row.schoolName,
      estb: row.estb,
      region: row.region,
      schoolDivision: row.schoolDivision,
      campusCount: row.campusCount,
      gradProgramCount: 0,
      gradAdmissionQuota: 0,
      admissionQuota: 0,
      recruit: {
        total: num(row.recruitTotal),
        within: num(row.recruitWithin),
        outside: num(row.recruitOutside),
      },
      enrolled: {
        total: num(row.admitTotal),
        within: num(row.admitWithin),
        outside: num(row.admitOutside),
      },
      fillRateWithin: row.rateIn,
      fillRateWithinOutside: row.rateAll,
      hasAlimi: true,
    })),
  );
}

export function studentFillScaleLookup(
  history: StudentFillChartHistoryYear[],
): EnrolledScaleLookupJson {
  const lookup: EnrolledScaleLookupJson = {};
  for (const { year, schools } of history) {
    const university: Record<string, number> = {};
    const juniorCollege: Record<string, number> = {};
    for (const row of schools) {
      if (row.enrolledTotal == null || !Number.isFinite(row.enrolledTotal)) continue;
      const code = normalizeSchoolCodeText(row.schoolCodeStd);
      if (!code) continue;
      if (row.schoolDivision === "전문대학") juniorCollege[code] = row.enrolledTotal;
      else university[code] = row.enrolledTotal;
    }
    lookup[String(year)] = { university, juniorCollege };
  }
  return lookup;
}
