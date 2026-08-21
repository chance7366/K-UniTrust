import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";
import type { UnivAlimiIndicatorId, UnivAlimiRawQuery } from "@/lib/analysis/univ-alimi-raw/types";
import { UNIV_MAP_BASE } from "@/lib/analysis/univ-map-tabs";

export const INDUSTRY_ACCOUNTING_TAB_ID = "industry-accounting";

export const INDUSTRY_ACCOUNTING_SHEETS = [
  {
    id: "industry-cash",
    label: "산단현금",
  },
  {
    id: "industry-balance",
    label: "산단대차",
  },
  {
    id: "industry-operation",
    label: "산단운영",
  },
] as const;

export type IndustryAccountingSheetId =
  (typeof INDUSTRY_ACCOUNTING_SHEETS)[number]["id"];

const SHEET_IDS = new Set<string>(INDUSTRY_ACCOUNTING_SHEETS.map((s) => s.id));

const LEGACY_SHEET_ALIASES: Record<string, IndustryAccountingSheetId> = {
  "industry-fund": "industry-cash",
};

export function isIndustryAccountingSheet(
  value: string | null | undefined,
): value is IndustryAccountingSheetId {
  return value != null && SHEET_IDS.has(value);
}

export function normalizeIndustryAccountingSheet(
  value: string | null | undefined,
): IndustryAccountingSheetId {
  if (isIndustryAccountingSheet(value)) return value;
  if (value && value in LEGACY_SHEET_ALIASES) {
    return LEGACY_SHEET_ALIASES[value]!;
  }
  return "industry-cash";
}

export function buildIndustryAccountingHref(
  indicator: UnivAlimiIndicatorId,
  query: UnivAlimiRawQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", INDUSTRY_ACCOUNTING_TAB_ID);
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

export function buildIndustryAccountingLegacyRedirect(
  tabId: string,
  searchParams: Record<string, string | undefined>,
): string | null {
  const sheet =
    tabId === "industry-fund"
      ? "industry-cash"
      : isIndustryAccountingSheet(tabId)
        ? tabId
        : null;
  if (!sheet) return null;

  const qs = new URLSearchParams();
  qs.set("tab", INDUSTRY_ACCOUNTING_TAB_ID);
  qs.set("sheet", sheet);
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "tab" || key === "sheet" || value == null) continue;
    qs.set(key, value);
  }
  return `${UNIV_MAP_BASE}?${qs.toString()}`;
}
