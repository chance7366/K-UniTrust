import * as XLSX from "xlsx";

import {
  CORP_TRANSFER_REP_COHORT_LABEL,
  buildCorpTransferRepRows,
  type AlimiEduFundTransfer,
  type CorpTransferRepCohort,
  type CorpTransferRepRow,
} from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import {
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { writeCsvFile } from "@/lib/csv/write";
import { readCsvFile } from "@/lib/csv/read";
import { isRepDbStale } from "@/lib/data/rep-db-persist";

const COHORTS: CorpTransferRepCohort[] = ["university", "junior-college"];

export const CORP_TRANSFER_REP_DB_COLUMNS = [
  "year",
  "cohort",
  "school_rep_code",
  "school_rep_name",
  "region",
  "estb",
  "school_division",
  "ordinary_expense_transfer",
  "legal_obligation_transfer",
  "asset_transfer",
  "total_transfer",
  "tuition_revenue",
  "transfer_ratio",
  "campus_count",
  "has_alimi",
  "updated_at",
] as const;

function rateCell(value: number | null): string {
  return value == null ? "" : String(value);
}

function toCsvRow(
  row: CorpTransferRepRow,
  cohort: CorpTransferRepCohort,
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
    ordinary_expense_transfer: row.ordinaryExpenseTransfer,
    legal_obligation_transfer: row.legalObligationTransfer,
    asset_transfer: row.assetTransfer,
    total_transfer: row.totalTransfer,
    tuition_revenue: row.tuitionRevenue,
    transfer_ratio: rateCell(row.transferRatio),
    campus_count: row.campusCount,
    has_alimi: row.hasAlimi ? "Y" : "N",
    updated_at: updatedAt,
  };
}

export async function persistCorpTransferRepDb(args: {
  rosterAll: AnalysisTargetCampus[];
  eduFund: AlimiEduFundTransfer[];
  years: number[];
}): Promise<void> {
  const stale = await isRepDbStale("financeAnalysisCorpTransferRatioRep", [
    "univMapAnalysisTarget",
    "univMapEduFund",
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
      for (const row of buildCorpTransferRepRows({
        cohort,
        displayYear: year,
        roster,
        eduFund: args.eduFund,
      })) {
        rows.push(toCsvRow(row, cohort, updatedAt));
      }
    }
  }

  await writeCsvFile(
    "financeAnalysisCorpTransferRatioRep",
    rows,
    [...CORP_TRANSFER_REP_DB_COLUMNS],
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
  "전입금 경상비",
  "전입금 법정부담",
  "전입금 자산",
  "전입금합계",
  "등록금수입",
  "전입금비율",
  "캠퍼스수",
  "알리미",
] as const;

function numOrEmpty(value: string | undefined): number | "" {
  if (value == null || value.trim() === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export async function buildCorpTransferRepDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile("financeAnalysisCorpTransferRatioRep").catch(
    () => [],
  );
  if (!rows.length) {
    throw new Error("저장된 법인전입금비율 대학별DB가 없습니다.");
  }

  const aoa: (string | number)[][] = [[...EXPORT_HEADER]];
  for (const row of rows) {
    const cohort = row.cohort as CorpTransferRepCohort;
    aoa.push([
      numOrEmpty(row.year),
      CORP_TRANSFER_REP_COHORT_LABEL[cohort] ?? row.cohort,
      row.school_rep_name ?? "",
      row.school_rep_code ?? "",
      row.region ?? "",
      row.estb ?? "",
      row.school_division ?? "",
      numOrEmpty(row.ordinary_expense_transfer),
      numOrEmpty(row.legal_obligation_transfer),
      numOrEmpty(row.asset_transfer),
      numOrEmpty(row.total_transfer),
      numOrEmpty(row.tuition_revenue),
      numOrEmpty(row.transfer_ratio),
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
    filename: "corp_transfer_ratio_rep_db.xlsx",
  };
}
