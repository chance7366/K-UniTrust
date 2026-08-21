/**
 * 2023·2024 중도탈락률 — 전문대 데이터 복구
 *
 * 2026-08-07 업로드가 2023/2024 연도 행을 4년제만 포함한 246행으로 덮어쓰면서
 * 전문대 137~138행이 소실됨. 2026-08-01 bronze 스냅샷에서 해당 연도를 복원한다.
 *
 * Usage: npx tsx scripts/repair-dropout-junior-college-data.ts
 */
import fs from "node:fs";
import path from "node:path";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { DROPOUT_RATE_CSV_COLUMNS } from "@/lib/ingest/dropout-rate-config";
import { consolidateDropoutRateYears } from "@/lib/ingest/dropout-rate-consolidate";

const BRONZE_RESTORE_PATH = path.join(
  process.cwd(),
  "data/01_raw/api/finance-analysis/finance-analysis_dropout-rate_20260801_052333.csv",
);

const RESTORE_YEARS = [2023, 2024] as const;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (vals[i] ?? "").trim();
    });
    return row;
  });
}

function isJuniorCollege(row: Record<string, string>): boolean {
  return (
    (row.school_kind ?? "").includes("전문") ||
    (row.school_division ?? "").includes("전문")
  );
}

async function main() {
  if (!fs.existsSync(BRONZE_RESTORE_PATH)) {
    throw new Error(`복원 bronze 파일 없음: ${BRONZE_RESTORE_PATH}`);
  }

  const restoreRows = parseCsv(fs.readFileSync(BRONZE_RESTORE_PATH, "utf8"));
  const restoreByYear = new Map<number, Record<string, string>[]>();
  for (const year of RESTORE_YEARS) {
    restoreByYear.set(
      year,
      restoreRows.filter((r) => Number(r.year) === year),
    );
  }

  const existing = await readCsvFile("financeAnalysisDropoutRate").catch(
    () => [],
  );
  const restoreYearSet = new Set(RESTORE_YEARS.map(String));
  const kept = existing.filter((r) => !restoreYearSet.has(r.year));
  const restored = RESTORE_YEARS.flatMap((y) => restoreByYear.get(y) ?? []);
  const merged = [...kept, ...restored];

  await writeCsvFile(
    "financeAnalysisDropoutRate",
    merged,
    [...DROPOUT_RATE_CSV_COLUMNS],
  );

  console.log("=== dropout raw CSV 복구 ===");
  for (const year of RESTORE_YEARS) {
    const rows = merged.filter((r) => Number(r.year) === year);
    const jc = rows.filter(isJuniorCollege);
    console.log(
      `${year}: ${rows.length}행 (전문대 ${jc.length}, 4년제 ${rows.length - jc.length})`,
    );
  }

  const consolidateResult = await consolidateDropoutRateYears([...RESTORE_YEARS]);
  console.log("\n=== 본교통합 재실행 ===");
  for (const y of consolidateResult.years) {
    console.log(
      `${y.year}: ${y.skipped ? "SKIP" : `${y.rowCount}행`}${y.reason ? ` (${y.reason})` : ""}`,
    );
  }
  console.log(`consolidated total: ${consolidateResult.totalRows}행`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
