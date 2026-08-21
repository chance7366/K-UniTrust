import * as XLSX from "xlsx";

import {
  FUND_SECURE_REP_COHORT_LABEL,
  buildFundSecureRepRows,
  type AlimiEduBalance,
  type AlimiEduFund,
  type AlimiIndustryBalance,
  type FundSecureRepCohort,
  type FundSecureRepRow,
} from "@/lib/analysis/fund-secure-rate-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: FundSecureRepCohort[] = ["university", "junior-college"];

export const FUND_SECURE_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "edu_carryover",
  "edu_endowment",
  "industry_carryover",
  "industry_endowment",
  "total_funds",
  "tuition_revenue",
  "fund_secure_rate",
  "campus_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(
  row: FundSecureRepRow,
  cohort: FundSecureRepCohort,
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
    edu_carryover: row.eduCarryover,
    edu_endowment: row.eduEndowment,
    industry_carryover: row.industryCarryover,
    industry_endowment: row.industryEndowment,
    total_funds: row.totalFunds,
    tuition_revenue: row.tuitionRevenue,
    fund_secure_rate: rateCell(row.fundSecureRate),
    campus_count: row.campusCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistFundSecureRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  eduBalance: AlimiEduBalance[];
  industryBalance: AlimiIndustryBalance[];
  eduFund: AlimiEduFund[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale("financeAnalysisFundSecureRateRep", [
    "univMapAnalysisTarget",
    "univMapEduBalance",
    "univMapEduFund",
    "univMapIndustryBalance",
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
      for (const row of buildFundSecureRepRows({
        cohort,
        displayYear: year,
        roster,
        eduBalance: args.eduBalance,
        industryBalance: args.industryBalance,
        eduFund: args.eduFund,
      })) {
        rows.push(toCsvRow(row, cohort, updatedAt));
      }
    }
  }

  await writeCsvFile(
    "financeAnalysisFundSecureRateRep",
    rows,
    [...FUND_SECURE_REP_DB_COLUMNS],
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
  "교비 이월자금",
  "교비 기금",
  "산단 이월자금",
  "산단 기금",
  "자금합계",
  "등록금수입",
  "자금확보율",
  "캠퍼스수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export async function buildFundSecureRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile("financeAnalysisFundSecureRateRep").catch(
    () => [],
  );
  if (!rows.length) {
    throw new Error("저장된 자금확보율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as FundSecureRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      FUND_SECURE_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      numOrEmpty(row.edu_carryover),
      numOrEmpty(row.edu_endowment),
      numOrEmpty(row.industry_carryover),
      numOrEmpty(row.industry_endowment),
      numOrEmpty(row.total_funds),
      numOrEmpty(row.tuition_revenue),
      numOrEmpty(row.fund_secure_rate),
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
    filename: "fund_secure_rate_rep_db.xlsx",
  };
}
