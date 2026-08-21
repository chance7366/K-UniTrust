import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";
import type { UnivAlimiIndicatorId, UnivAlimiRawQuery } from "@/lib/analysis/univ-alimi-raw/types";
import { UNIV_MAP_BASE } from "@/lib/analysis/univ-map-tabs";

export const EDU_ACCOUNTING_TAB_ID = "edu-accounting";

export const EDU_ACCOUNTING_SHEETS = [
  {
    id: "edu-fund",
    label: "교비자금(수입)",
  },
  {
    id: "edu-fund-expense",
    label: "교비자금(지출)",
  },
  {
    id: "edu-balance",
    label: "교비대차",
  },
  {
    id: "edu-operation",
    label: "교비운영",
  },
] as const;

export type EduAccountingSheetId = (typeof EDU_ACCOUNTING_SHEETS)[number]["id"];

const SHEET_IDS = new Set<string>(EDU_ACCOUNTING_SHEETS.map((s) => s.id));

export function isEduAccountingSheet(
  value: string | null | undefined,
): value is EduAccountingSheetId {
  return value != null && SHEET_IDS.has(value);
}

export function normalizeEduAccountingSheet(
  value: string | null | undefined,
): EduAccountingSheetId {
  return isEduAccountingSheet(value) ? value : "edu-fund";
}

export function buildEduAccountingHref(
  indicator: UnivAlimiIndicatorId,
  query: UnivAlimiRawQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", EDU_ACCOUNTING_TAB_ID);
  params.set("sheet", indicator);

  if (query.dataset) {
    params.set("dataset", query.dataset);
  }
  if (query.year != null) {
    params.set("year", String(query.year));
  }

  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (query.schoolDivision) {
      params.set("schoolDivision", query.schoolDivision);
    }
    const schoolKinds = serializeMultiFilterParam(
      parseMultiFilterParam(query.schoolKind),
    );
    if (schoolKinds) params.set("schoolKind", schoolKinds);
    const regions = serializeMultiFilterParam(
      parseMultiFilterParam(query.region),
    );
    if (regions) params.set("region", regions);
    if (query.search) params.set("search", query.search);
  }

  return `${UNIV_MAP_BASE}?${params.toString()}`;
}

export function buildEduAccountingLegacyRedirect(
  tabId: string,
  searchParams: Record<string, string | undefined>,
): string | null {
  if (!isEduAccountingSheet(tabId)) return null;

  const qs = new URLSearchParams();
  qs.set("tab", EDU_ACCOUNTING_TAB_ID);
  qs.set("sheet", tabId);
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "tab" || key === "sheet" || value == null) continue;
    qs.set(key, value);
  }
  return `${UNIV_MAP_BASE}?${qs.toString()}`;
}
