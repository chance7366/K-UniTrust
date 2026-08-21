import { readCsvFile } from "@/lib/csv/read";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";
import { parseIndicatorYearLabel } from "@/lib/competitiveness-analysis/parse-indicator-year";
import {
  FUND_SECURE_MAIN_CAMPUS_SPEC,
  rollupCsvRowsToMainCampus,
} from "@/lib/ingest/main-campus-rollup";

function padCode(v: string): string {
  const raw = v.trim();
  if (!raw) return "";
  return /^\d+$/.test(raw) ? raw.padStart(7, "0") : raw;
}

function num(v: string | undefined | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const DEFAULT_FUND_SECURE_YEAR = 2025;

/** 자금확보율(본교통합) 자금합계가 음수인 학교코드 집합 */
export async function buildFundShortageCodeSet(
  year: number,
): Promise<Set<string>> {
  const raw = await readCsvFile("financeAnalysisFundSecureRate");
  const rolled = await rollupCsvRowsToMainCampus(raw, FUND_SECURE_MAIN_CAMPUS_SPEC);
  const codes = new Set<string>();

  for (const row of rolled) {
    if (num(row.year) !== year) continue;
    const totalFunds = num(row.total_funds);
    if (totalFunds != null && totalFunds < 0) {
      codes.add(padCode(row.school_code_std ?? ""));
    }
  }

  return codes;
}

function resolveFundSecureYear(yearLabel?: string): number {
  const parsed = yearLabel ? parseIndicatorYearLabel(yearLabel) : null;
  return parsed?.year ?? DEFAULT_FUND_SECURE_YEAR;
}

/** 업로드 대상대학에 자금부족(자금합계<0) 플래그 적용 — 엑셀 J열은 무시 */
export async function applyFundShortageFlags(
  rows: TargetUniversityRow[],
  fundSecureYearLabel?: string,
): Promise<TargetUniversityRow[]> {
  const year = resolveFundSecureYear(fundSecureYearLabel);
  const shortageCodes = await buildFundShortageCodeSet(year);

  return rows.map((row) => ({
    ...row,
    fundShortage: shortageCodes.has(row.schoolCodeStd) ? "해당" : "",
  }));
}
