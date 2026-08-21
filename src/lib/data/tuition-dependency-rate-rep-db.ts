import * as XLSX from "xlsx";

import {
  TUITION_DEP_REP_COHORT_LABEL,
  buildTuitionDepRepRows,
  type AlimiEduFundTuition,
  type AlimiIndustryCash,
  type TuitionDepRepCohort,
  type TuitionDepRepRow,
} from "@/lib/analysis/tuition-dependency-rate-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: TuitionDepRepCohort[] = ["university", "junior-college"];

export const TUITION_DEP_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "tuition_revenue",
  "edu_operating_revenue",
  "industry_operating_revenue",
  "total_operating_revenue",
  "tuition_dependency_rate",
  "campus_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(
  row: TuitionDepRepRow,
  cohort: TuitionDepRepCohort,
  updatedAt: string,
) {
  return {
    year: row.year,
    cohort,
    school_rep_code: row.schoolRepCode,
    school_rep_name: row.schoolRepName,
    region: row.region,
    estb: row.estb,
    school_division: row.schoolDivision,
    tuition_revenue: row.tuitionRevenue,
    edu_operating_revenue: row.eduOperatingRevenue,
    industry_operating_revenue: row.industryOperatingRevenue,
    total_operating_revenue: row.totalOperatingRevenue,
    tuition_dependency_rate: rateCell(row.tuitionDependencyRate),
    campus_count: row.campusCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistTuitionDepRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  eduFund: AlimiEduFundTuition[];
  industryCash: AlimiIndustryCash[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale("financeAnalysisTuitionDependencyRateRep", [
    "univMapAnalysisTarget",
    "univMapEduFund",
    "univMapIndustryCash",
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
      for (const row of buildTuitionDepRepRows({
        cohort,
        displayYear: year,
        roster,
        eduFund: args.eduFund,
        industryCash: args.industryCash,
      })) {
        rows.push(toCsvRow(row, cohort, updatedAt));
      }
    }
  }

  await writeCsvFile(
    "financeAnalysisTuitionDependencyRateRep",
    rows,
    [...TUITION_DEP_REP_DB_COLUMNS],
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
  "등록금수입",
  "운영수입 교비회계",
  "운영수입 산단회계",
  "운영수입합계",
  "등록금의존율",
  "캠퍼스수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export async function buildTuitionDepRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile("financeAnalysisTuitionDependencyRateRep").catch(
    () => [],
  );
  if (!rows.length) {
    throw new Error("저장된 등록금의존율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as TuitionDepRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      TUITION_DEP_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      numOrEmpty(row.tuition_revenue),
      numOrEmpty(row.edu_operating_revenue),
      numOrEmpty(row.industry_operating_revenue),
      numOrEmpty(row.total_operating_revenue),
      numOrEmpty(row.tuition_dependency_rate),
      numOrEmpty(row.campus_count),
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
    filename: "tuition_dependency_rate_rep_db.xlsx",
  };
}
