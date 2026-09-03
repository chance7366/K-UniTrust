import { writePersistentTextFile } from "@/lib/persistent-data-file";

import { buildSettlementReportHtml } from "./build-settlement-report-html";
import { loadSettlementIncomeReport } from "./load-settlement-income";
import type { SettlementIncomeReportData } from "./settlement-income-types";

export function eduSettlementSnapshotPath(year: number): string {
  return `reports/edu-settlement/${year}.html`;
}

export async function generateEduSettlementReport(year: number | null): Promise<{
  data: SettlementIncomeReportData;
  html: string;
}> {
  const data = await loadSettlementIncomeReport(year);
  const html = buildSettlementReportHtml(data);
  return { data, html };
}

export async function saveEduSettlementReport(
  year: number,
  html: string,
): Promise<void> {
  await writePersistentTextFile(
    eduSettlementSnapshotPath(year),
    html,
    "text/html; charset=utf-8",
  );
}
