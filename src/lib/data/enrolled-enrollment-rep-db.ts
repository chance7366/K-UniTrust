import * as XLSX from "xlsx";

import {
  ENROLLED_REP_COHORT_LABEL,
  buildEnrolledRepRows,
  type AlimiEnrolledGrad,
  type AlimiEnrolledUndergrad,
  type EnrolledRepCohort,
  type EnrolledRepRow,
} from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: EnrolledRepCohort[] = [
  "university",
  "junior-college",
  "graduate",
  "combined",
];

export const ENROLLED_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "student_quota",
  "recruitment_stop",
  "enrolled_total",
  "enrolled_within",
  "enrolled_outside",
  "fill_rate_within",
  "fill_rate_within_outside",
  "campus_count",
  "grad_program_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(row: EnrolledRepRow, cohort: EnrolledRepCohort, updatedAt: string) {
  return {
    year: row.year,
    cohort,
    school_rep_code: row.schoolRepCode,
    school_rep_name: row.schoolRepName,
    region: row.region,
    estb: row.estb,
    school_division: row.schoolDivision,
    student_quota: row.studentQuota,
    recruitment_stop: row.recruitmentStop,
    enrolled_total: row.enrolled.total,
    enrolled_within: row.enrolled.within,
    enrolled_outside: row.enrolled.outside,
    fill_rate_within: rateCell(row.fillRateWithin),
    fill_rate_within_outside: rateCell(row.fillRateWithinOutside),
    campus_count: row.campusCount,
    grad_program_count: row.gradProgramCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistEnrolledRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  undergrad: AlimiEnrolledUndergrad[];
  grad: AlimiEnrolledGrad[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale("financeAnalysisEnrolledEnrollmentRep", [
    "univMapAnalysisTarget",
    "univMapEnrolledEnrollmentUndergrad",
    "univMapEnrolledEnrollmentGrad",
  ]);
  if (!stale) return;

  const updatedAt = new Date().toISOString();
  const rosterYears = [...new Set(args.rosterAll.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  const rows: Record<string, unknown>[] = [];
  for (const year of [...args.years].sort((a, b) => a - b)) {
    const rosterYear = pickNearestYear(rosterYears, year);
    const roster =
      rosterYear != null
        ? args.rosterAll.filter((row) => row.year === rosterYear)
        : [];
    if (!roster.length) continue;
    for (const cohort of COHORTS) {
      for (const row of buildEnrolledRepRows({
        cohort,
        displayYear: year,
        roster,
        undergrad: args.undergrad,
        grad: args.grad,
      })) {
        rows.push(toCsvRow(row, cohort, updatedAt));
      }
    }
  }

  await writeCsvFile(
    "financeAnalysisEnrolledEnrollmentRep",
    rows,
    [...ENROLLED_REP_DB_COLUMNS],
  );
}

const EXPORT_HEADER = [
  "연도",
  "코호트",
  "학교명",
  "대표학교코드",
  "지역",
  "설립",
  "학교구분",
  "학생정원",
  "학생모집정지인원",
  "재학생 계",
  "재학생 정원내",
  "재학생 정원외",
  "정원내 재학생충원율",
  "정원내외 재학생충원율",
  "캠퍼스수",
  "과정수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export async function buildEnrolledRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile("financeAnalysisEnrolledEnrollmentRep").catch(
    () => [],
  );
  if (!rows.length) {
    throw new Error("저장된 재학생충원율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as EnrolledRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      ENROLLED_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      numOrEmpty(row.student_quota),
      numOrEmpty(row.recruitment_stop),
      numOrEmpty(row.enrolled_total),
      numOrEmpty(row.enrolled_within),
      numOrEmpty(row.enrolled_outside),
      numOrEmpty(row.fill_rate_within),
      numOrEmpty(row.fill_rate_within_outside),
      numOrEmpty(row.campus_count),
      numOrEmpty(row.grad_program_count),
      row.has_alimi ?? "",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "대학별DB");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
  return {
    buffer,
    filename: "enrolled_enrollment_rep_db.xlsx",
  };
}

