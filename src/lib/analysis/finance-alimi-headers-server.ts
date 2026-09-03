import { financeAlimiHeaderRow } from "@/lib/analysis/finance-alimi-header-lookup";
import type { UnivAlimiIndicatorId } from "@/lib/analysis/univ-alimi-raw/types";
import { readUnivAlimiRawMeta } from "@/lib/ingest/univ-alimi-raw-meta";

export async function loadFinanceAlimiHeaders(
  indicator: UnivAlimiIndicatorId,
): Promise<string[]> {
  const meta = await readUnivAlimiRawMeta(indicator, "undergrad").catch(() => null);
  return financeAlimiHeaderRow(meta);
}
