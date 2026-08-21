import * as XLSX from "xlsx";

import {
  INCOME_PROPERTY_REP_COHORT_LABEL,
  buildIncomePropertyRepRows,
  cheonToMillion1,
  type AlimiEduFundTuition,
  type AlimiIncomeProperty,
  type IncomePropertyRepCohort,
  type IncomePropertyRepRow,
} from "@/lib/analysis/income-property-secure-rate-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: IncomePropertyRepCohort[] = ["university", "junior-college"];

export const INCOME_PROPERTY_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "appraised_gross",
  "collateral_deduction",
  "appraised_net",
  "income_total",
  "tuition_revenue",
  "secure_rate",
  "revenue_rate",
  "campus_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(
  row: IncomePropertyRepRow,
  cohort: IncomePropertyRepCohort,
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
    appraised_gross: row.appraisedGross,
    collateral_deduction: row.collateralDeduction,
    appraised_net: row.appraisedNet,
    income_total: row.incomeTotal,
    tuition_revenue: row.tuitionRevenue,
    secure_rate: rateCell(row.secureRate),
    revenue_rate: rateCell(row.revenueRate),
    campus_count: row.campusCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistIncomePropertyRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  property: AlimiIncomeProperty[];
  eduFund: AlimiEduFundTuition[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale(
    "financeAnalysisIncomePropertySecureRateRep",
    ["univMapAnalysisTarget", "univMapIncomeProperty", "univMapEduFund"],
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
      for (const row of buildIncomePropertyRepRows({
        cohort,
        displayYear: year,
        roster,
        property: args.property,
        eduFund: args.eduFund,
      })) {
        rows.push(toCsvRow(row, cohort, updatedAt));
      }
    }
  }

  await writeCsvFile(
    "financeAnalysisIncomePropertySecureRateRep",
    rows,
    [...INCOME_PROPERTY_REP_DB_COLUMNS],
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
  "수익용재산평가액 평가액",
  "수익용재산평가액 담보차감액",
  "수익용재산평가액 소계",
  "수입액",
  "등록금수입",
  "확보율",
  "수익율",
  "캠퍼스수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function millionWonFromCheon(value: string | undefined): number | "" {
  const n = numOrEmpty(value);
  if (n === "") return "";
  return cheonToMillion1(n) ?? "";
}

export async function buildIncomePropertyRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile(
    "financeAnalysisIncomePropertySecureRateRep",
  ).catch(() => []);
  if (!rows.length) {
    throw new Error("저장된 수익용재산확보율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as IncomePropertyRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      INCOME_PROPERTY_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      millionWonFromCheon(row.appraised_gross),
      millionWonFromCheon(row.collateral_deduction),
      millionWonFromCheon(row.appraised_net),
      millionWonFromCheon(row.income_total),
      millionWonFromCheon(row.tuition_revenue),
      numOrEmpty(row.secure_rate),
      numOrEmpty(row.revenue_rate),
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
    filename: "income_property_secure_rate_rep_db.xlsx",
  };
}
