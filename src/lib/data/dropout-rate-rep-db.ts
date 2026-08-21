import * as XLSX from "xlsx";

import {
  DROPOUT_REP_COHORT_LABEL,
  buildDropoutRepRows,
  type AlimiDropoutGrad,
  type AlimiDropoutUndergrad,
  type DropoutRepCohort,
  type DropoutRepRow,
} from "@/lib/analysis/dropout-rate-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: DropoutRepCohort[] = [
  "university",
  "junior-college",
  "graduate",
  "combined",
];

export const DROPOUT_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "enrolled_students",
  "enrolled_dropouts",
  "enrolled_dropout_rate",
  "freshman_students",
  "freshman_dropouts",
  "freshman_dropout_rate",
  "campus_count",
  "grad_program_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(row: DropoutRepRow, cohort: DropoutRepCohort, updatedAt: string) {
  return {
    year: row.year,
    cohort,
    school_rep_code: row.schoolRepCode,
    school_rep_name: row.schoolRepName,
    region: row.region,
    estb: row.estb,
    school_division: row.schoolDivision,
    enrolled_students: row.enrolled.students,
    enrolled_dropouts: row.enrolled.dropouts,
    enrolled_dropout_rate: rateCell(row.enrolled.rate),
    freshman_students: cohort === "graduate" ? "" : row.freshman.students,
    freshman_dropouts: cohort === "graduate" ? "" : row.freshman.dropouts,
    freshman_dropout_rate:
      cohort === "graduate" ? "" : rateCell(row.freshman.rate),
    campus_count: row.campusCount,
    grad_program_count: row.gradProgramCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistDropoutRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  undergrad: AlimiDropoutUndergrad[];
  grad: AlimiDropoutGrad[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale("financeAnalysisDropoutRateRep", [
    "univMapAnalysisTarget",
    "univMapDropoutRateUndergrad",
    "univMapDropoutRateGrad",
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
      for (const row of buildDropoutRepRows({
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
    "financeAnalysisDropoutRateRep",
    rows,
    [...DROPOUT_REP_DB_COLUMNS],
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
  "재적학생",
  "재적 중도탈락",
  "재적학생 중도탈락율",
  "신입생",
  "신입생 중도탈락",
  "신입생 중도탈락율",
  "캠퍼스수",
  "과정수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export async function buildDropoutRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile("financeAnalysisDropoutRateRep").catch(
    () => [],
  );
  if (!rows.length) {
    throw new Error("저장된 중도탈락율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as DropoutRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      DROPOUT_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      numOrEmpty(row.enrolled_students),
      numOrEmpty(row.enrolled_dropouts),
      numOrEmpty(row.enrolled_dropout_rate),
      numOrEmpty(row.freshman_students),
      numOrEmpty(row.freshman_dropouts),
      numOrEmpty(row.freshman_dropout_rate),
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
    filename: "dropout_rate_rep_db.xlsx",
  };
}
