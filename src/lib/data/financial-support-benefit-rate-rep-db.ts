import * as XLSX from "xlsx";

import {
  FIN_SUPPORT_REP_COHORT_LABEL,
  buildFinSupportRepRows,
  cheonToMillion1,
  wonToMillion1,
  type AlimiEduFundTuition,
  type AlimiFinancialSupport,
  type FinSupportRepCohort,
  type FinSupportRepRow,
} from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: FinSupportRepCohort[] = ["university", "junior-college"];

export const FIN_SUPPORT_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "central_ministries",
  "national_scholarship",
  "central_subtotal",
  "local_government",
  "total_support",
  "tuition_revenue",
  "benefit_rate",
  "campus_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(
  row: FinSupportRepRow,
  cohort: FinSupportRepCohort,
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
    central_ministries: row.centralMinistries,
    national_scholarship: row.nationalScholarship,
    central_subtotal: row.centralSubtotal,
    local_government: row.localGovernment,
    total_support: row.totalSupport,
    tuition_revenue: row.tuitionRevenue,
    benefit_rate: rateCell(row.benefitRate),
    campus_count: row.campusCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistFinSupportRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  support: AlimiFinancialSupport[];
  eduFund: AlimiEduFundTuition[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale(
    "financeAnalysisFinancialSupportBenefitRateRep",
    ["univMapAnalysisTarget", "univMapFinancialSupport", "univMapEduFund"],
  );
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
      for (const row of buildFinSupportRepRows({
        cohort,
        displayYear: year,
        roster,
        support: args.support,
        eduFund: args.eduFund,
      })) {
        rows.push(toCsvRow(row, cohort, updatedAt));
      }
    }
  }

  await writeCsvFile(
    "financeAnalysisFinancialSupportBenefitRateRep",
    rows,
    [...FIN_SUPPORT_REP_DB_COLUMNS],
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
  "재정지원 중앙부처",
  "재정지원 (국가장학금)",
  "재정지원 소계",
  "지자체",
  "지원액합계",
  "등록금수입",
  "재정지원수혜율",
  "캠퍼스수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function millionWonFromWon(value: string | undefined): number | "" {
  const n = numOrEmpty(value);
  if (n === "") return "";
  return wonToMillion1(n) ?? "";
}

function millionWonFromCheon(value: string | undefined): number | "" {
  const n = numOrEmpty(value);
  if (n === "") return "";
  return cheonToMillion1(n) ?? "";
}

export async function buildFinSupportRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile(
    "financeAnalysisFinancialSupportBenefitRateRep",
  ).catch(() => []);
  if (!rows.length) {
    throw new Error("저장된 재정지원수혜율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as FinSupportRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      FIN_SUPPORT_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      millionWonFromWon(row.central_ministries),
      millionWonFromWon(row.national_scholarship),
      millionWonFromWon(row.central_subtotal),
      millionWonFromWon(row.local_government),
      millionWonFromWon(row.total_support),
      millionWonFromCheon(row.tuition_revenue),
      numOrEmpty(row.benefit_rate),
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
    filename: "financial_support_benefit_rate_rep_db.xlsx",
  };
}
