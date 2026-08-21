import { readCsvFile } from "@/lib/csv/read";
import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import {
  enrichIncomePropertyRows,
  padSchoolCodeStd,
  tuitionMapKey,
} from "@/lib/analysis/income-property-secure-rate-analytics";
import {
  matchesSchoolNameSearch,
  parseMultiFilterParam,
  rowMatchesTableFilters,
} from "@/lib/analysis/table-filter-utils";
import {
  FUND_SECURE_MAIN_CAMPUS_SPEC,
  INCOME_PROPERTY_MAIN_CAMPUS_SPEC,
  rollupCsvRowsToMainCampus,
} from "@/lib/ingest/main-campus-rollup";
import {
  enrichRowsWithSchoolDivision,
  loadSchoolDivisionLookup,
} from "@/lib/ingest/school-code-lookup";
import type {
  IncomePropertySecureRateDisplayRow,
  IncomePropertySecureRateRow,
} from "@/lib/ingest/income-property-secure-rate-config";

export type IncomePropertySecureRateSection = "charts" | "data";

export type IncomePropertySecureRateQuery = {
  year?: number | null;
  estb?: string;
  schoolKind?: string;
  schoolDivision?: string;
  region?: string;
  search?: string;
  section?: IncomePropertySecureRateSection;
};

export type IncomePropertySecureRateFilterOptions = {
  estbs: string[];
  schoolKinds: string[];
  schoolDivisions: string[];
  regions: string[];
};

export type IncomePropertySecureRateDashboardData = {
  years: number[];
  displayYear: number | null;
  rows: IncomePropertySecureRateDisplayRow[];
  advancedChartRows: IncomePropertySecureRateDisplayRow[];
  section: IncomePropertySecureRateSection;
  filterOptions: IncomePropertySecureRateFilterOptions;
  yearRowCount: number;
  filters: {
    estb: string;
    schoolDivision: string;
    schoolKinds: string[];
    regions: string[];
    search: string;
  };
  hasData: boolean;
  uploadedAt: string | null;
  rowCount: number;
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function buildSchoolKindLookup(
  schoolCodeRows: Record<string, string>[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of schoolCodeRows) {
    const year = num(row.year);
    const code = padSchoolCodeStd(row.school_code_std ?? "");
    const kind = row.school_kind?.trim();
    if (!year || !code || !kind) continue;
    map.set(tuitionMapKey(year, code), kind);
  }
  return map;
}

function parseRow(
  r: Record<string, string>,
  schoolKindLookup: Map<string, string>,
): IncomePropertySecureRateRow | null {
  const year = num(r.year);
  const schoolCodeStd = padSchoolCodeStd(r.school_code_std ?? "");
  const schoolName = r.school_name?.trim();
  if (!year || !schoolCodeStd || !schoolName) return null;

  return {
    year,
    schoolCodeStd,
    schoolName,
    corpName: r.corp_name ?? "",
    schoolDivision: r.school_division ?? "",
    schoolKind: schoolKindLookup.get(tuitionMapKey(year, schoolCodeStd)) ?? "",
    region: r.region ?? "",
    estb: r.estb ?? "",
    schoolStatus: r.school_status ?? "",
    landAppraised: num(r.land_appraised) ?? 0,
    landNetIncome: num(r.land_net_income) ?? 0,
    buildingAppraised: num(r.building_appraised) ?? 0,
    buildingNetIncome: num(r.building_net_income) ?? 0,
    securitiesAppraised: num(r.securities_appraised) ?? 0,
    securitiesNetIncome: num(r.securities_net_income) ?? 0,
    depositAppraised: num(r.deposit_appraised) ?? 0,
    depositNetIncome: num(r.deposit_net_income) ?? 0,
    otherAppraised: num(r.other_appraised) ?? 0,
    otherNetIncome: num(r.other_net_income) ?? 0,
    collateralDeduction: num(r.collateral_deduction) ?? 0,
    totalAppraised: num(r.total_appraised) ?? 0,
    totalNetIncome: num(r.total_net_income) ?? 0,
  };
}

async function loadTuitionByYearCode(): Promise<Map<string, number>> {
  const raw = await readCsvFile("financeAnalysisFundSecureRate").catch(() => []);
  const rolledUp = await rollupCsvRowsToMainCampus(
    raw,
    FUND_SECURE_MAIN_CAMPUS_SPEC,
  );
  const map = new Map<string, number>();

  for (const r of rolledUp) {
    const year = num(r.year);
    const code = padSchoolCodeStd(r.school_code_std ?? "");
    const tuition = num(r.tuition_revenue);
    if (!year || !code || tuition == null) continue;
    map.set(tuitionMapKey(year, code), tuition);
  }

  return map;
}

type RawFilterRow = {
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  region: string;
};

export async function loadIncomePropertySecureRateDashboard(
  query: IncomePropertySecureRateQuery = {},
): Promise<IncomePropertySecureRateDashboardData> {
  const [raw, divisionLookup, tuitionByYearCode, schoolCodeRows] =
    await Promise.all([
      readCsvFile("financeAnalysisIncomePropertySecureRate").catch(() => []),
      loadSchoolDivisionLookup(),
      loadTuitionByYearCode(),
      readCsvFile("financeAnalysisSchoolCode").catch(() => []),
    ]);

  const rolledUp = await rollupCsvRowsToMainCampus(
    raw,
    INCOME_PROPERTY_MAIN_CAMPUS_SPEC,
  );
  const enriched = enrichRowsWithSchoolDivision(rolledUp, divisionLookup);
  const schoolKindLookup = buildSchoolKindLookup(schoolCodeRows);

  const yearSet = new Set<number>();
  let uploadedAt: string | null = null;

  for (const r of enriched) {
    const year = num(r.year);
    if (year) yearSet.add(year);
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) uploadedAt = at;
  }

  const years = [...yearSet].sort((a, b) => a - b);
  const section: IncomePropertySecureRateSection =
    query.section === "charts" ? "charts" : "data";

  const allParsedRows: IncomePropertySecureRateRow[] = [];
  let advancedChartRows: IncomePropertySecureRateDisplayRow[] = [];
  if (section === "charts") {
    for (const r of enriched) {
      const parsed = parseRow(r, schoolKindLookup);
      if (parsed) allParsedRows.push(parsed);
    }
    advancedChartRows = enrichIncomePropertyRows(
      allParsedRows,
      tuitionByYearCode,
    );
    advancedChartRows.sort(
      (a, b) =>
        a.year - b.year ||
        a.schoolName.localeCompare(b.schoolName, "ko") ||
        a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko"),
    );
  }

  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (years.at(-1) ?? null);

  const estbFilter = query.estb?.trim() ?? "";
  const schoolDivisionFilter = query.schoolDivision?.trim() ?? "";
  const schoolKindsFilter = parseMultiFilterParam(query.schoolKind);
  const regionsFilter = parseMultiFilterParam(query.region);
  const searchFilter = query.search?.trim() ?? "";

  const estbSet = new Set<string>();
  const schoolDivisionSet = new Set<string>();
  const regionSet = new Set<string>();
  const optionRows: RawFilterRow[] = [];
  let yearRowCount = 0;
  const rows: IncomePropertySecureRateDisplayRow[] = [];

  if (displayYear != null) {
    for (const r of enriched) {
      const parsed = parseRow(r, schoolKindLookup);
      if (!parsed || parsed.year !== displayYear) continue;

      yearRowCount += 1;
      optionRows.push({
        estb: parsed.estb,
        schoolKind: parsed.schoolKind,
        schoolDivision: parsed.schoolDivision,
        region: parsed.region,
      });
      if (parsed.estb) estbSet.add(parsed.estb);
      if (parsed.schoolDivision) schoolDivisionSet.add(parsed.schoolDivision);
      if (parsed.region) regionSet.add(parsed.region);
    }

    const tableFilters = {
      estb: estbFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKinds: schoolKindsFilter,
      regions: regionsFilter,
    };

    for (const r of enriched) {
      const parsed = parseRow(r, schoolKindLookup);
      if (!parsed || parsed.year !== displayYear) continue;

      if (
        !rowMatchesTableFilters(
          {
            estb: parsed.estb,
            schoolKind: parsed.schoolKind,
            schoolDivision: parsed.schoolDivision,
            region: parsed.region,
            schoolName: parsed.schoolName,
          },
          tableFilters,
        )
      ) {
        continue;
      }

      if (
        searchFilter &&
        !matchesSchoolNameSearch(parsed.schoolName, searchFilter) &&
        !matchesSchoolNameSearch(parsed.corpName, searchFilter)
      ) {
        continue;
      }

      rows.push(enrichIncomePropertyRows([parsed], tuitionByYearCode)[0]!);
    }
  }

  const schoolKindOptions = getTableSchoolKindOptions(
    optionRows,
    estbFilter,
    schoolDivisionFilter,
  );

  rows.sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));

  return {
    years,
    displayYear,
    rows,
    advancedChartRows,
    section,
    filterOptions: {
      estbs: sortKo([...estbSet]),
      schoolKinds: schoolKindOptions,
      schoolDivisions: sortKo([...schoolDivisionSet]),
      regions: sortKo([...regionSet]),
    },
    yearRowCount,
    filters: {
      estb: estbFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKinds: schoolKindsFilter,
      regions: regionsFilter,
      search: searchFilter,
    },
    hasData: years.length > 0,
    uploadedAt,
    rowCount: enriched.length,
  };
}

export function parseIncomePropertySecureRateQuery(searchParams: {
  year?: string;
  estb?: string;
  schoolKind?: string;
  schoolDivision?: string;
  region?: string;
  search?: string;
  section?: string;
}): IncomePropertySecureRateQuery {
  const year = Number(searchParams.year);
  const section = searchParams.section === "charts" ? "charts" : "data";
  return {
    year: Number.isFinite(year) ? year : null,
    estb: searchParams.estb,
    schoolKind: searchParams.schoolKind,
    schoolDivision: searchParams.schoolDivision,
    region: searchParams.region,
    search: searchParams.search,
    section,
  };
}
