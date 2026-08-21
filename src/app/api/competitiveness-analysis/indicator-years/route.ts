import { readCsvFile } from "@/lib/csv/read";
import {
  FINANCE_TAB_CSV_KEY,
  buildIndicatorYearOptions,
  getCompetitivenessIndicators,
} from "@/lib/analysis/competitiveness-indicators";
import type { CsvFileKey } from "@/lib/csv/paths";

function yearsFromRows(rows: Record<string, string>[]): number[] {
  const set = new Set<number>();
  for (const row of rows) {
    const y = Number(row.year);
    if (Number.isFinite(y)) set.add(y);
  }
  return [...set].sort((a, b) => a - b);
}

export async function GET() {
  const indicators = getCompetitivenessIndicators();
  const yearsByTab: Record<string, string[]> = {};

  await Promise.all(
    indicators.map(async (ind) => {
      const csvKey = FINANCE_TAB_CSV_KEY[ind.financeTabId] as
        | CsvFileKey
        | undefined;
      if (!csvKey) {
        yearsByTab[ind.financeTabId] = buildIndicatorYearOptions(
          ind.financeTabId,
          [],
        );
        return;
      }
      const rows = await readCsvFile(csvKey).catch(() => []);
      yearsByTab[ind.financeTabId] = buildIndicatorYearOptions(
        ind.financeTabId,
        yearsFromRows(rows),
      );
    }),
  );

  return Response.json({ yearsByTab, indicators });
}
