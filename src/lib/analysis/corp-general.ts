import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";
import type { UnivAlimiIndicatorId, UnivAlimiRawQuery } from "@/lib/analysis/univ-alimi-raw/types";
import { UNIV_MAP_BASE } from "@/lib/analysis/univ-map-tabs";

export const CORP_GENERAL_TAB_ID = "corp-general";

export const CORP_GENERAL_SHEETS = [
  {
    id: "corp-fund",
    label: "법인자금(수입)",
  },
  {
    id: "corp-fund-expense",
    label: "법인자금(지출)",
  },
  {
    id: "corp-balance",
    label: "법인대차",
  },
  {
    id: "corp-operation",
    label: "법인운영",
  },
] as const;

export type CorpGeneralSheetId = (typeof CORP_GENERAL_SHEETS)[number]["id"];

const SHEET_IDS = new Set<string>(CORP_GENERAL_SHEETS.map((s) => s.id));

export function isCorpGeneralSheet(
  value: string | null | undefined,
): value is CorpGeneralSheetId {
  return value != null && SHEET_IDS.has(value);
}

export function normalizeCorpGeneralSheet(
  value: string | null | undefined,
): CorpGeneralSheetId {
  return isCorpGeneralSheet(value) ? value : "corp-fund";
}

export function buildCorpGeneralHref(
  indicator: UnivAlimiIndicatorId,
  query: UnivAlimiRawQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", CORP_GENERAL_TAB_ID);
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
