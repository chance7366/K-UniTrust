import { readCsvFile } from "@/lib/csv/read";

import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";

import {

  parseMultiFilterParam,

  rowMatchesTableFilters,

} from "@/lib/analysis/table-filter-utils";

import {
  FUND_SECURE_MAIN_CAMPUS_SPEC,
  rollupCsvRowsToMainCampus,
} from "@/lib/ingest/main-campus-rollup";

import {

  enrichRowsWithSchoolDivision,

  loadSchoolDivisionLookup,

} from "@/lib/ingest/school-code-lookup";

import type { FundSecureRateRow } from "@/lib/ingest/fund-secure-rate-config";

export type FundSecureRateSection = "charts" | "data";

export type FundSecureRateQuery = {
  year?: number | null;
  estb?: string;
  schoolKind?: string;
  schoolDivision?: string;
  region?: string;
  search?: string;
  section?: FundSecureRateSection;
};

export type FundSecureRateFilterOptions = {
  estbs: string[];
  schoolKinds: string[];
  schoolDivisions: string[];
  regions: string[];
};



export type FundSecureRateDashboardData = {

  years: number[];

  displayYear: number | null;

  rows: FundSecureRateRow[];

  allRows: FundSecureRateRow[];

  advancedChartRows: FundSecureRateRow[];

  section: FundSecureRateSection;

  filterOptions: FundSecureRateFilterOptions;

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



function parseRow(r: Record<string, string>): FundSecureRateRow | null {

  const year = num(r.year);

  const schoolCodeStd = r.school_code_std?.trim();

  const schoolName = r.school_name?.trim();

  if (!year || !schoolCodeStd || !schoolName) return null;



  return {

    year,

    schoolCodeStd,

    schoolName,

    schoolDivision: r.school_division ?? "",

    schoolKind: r.school_kind ?? "",

    region: r.region ?? "",

    estb: r.estb ?? "",

    schoolFundsCarryover: num(r.school_funds_carryover) ?? 0,

    schoolFundsEndowment: num(r.school_funds_endowment) ?? 0,

    industryCarryover: num(r.industry_carryover) ?? 0,

    industryEndowment: num(r.industry_endowment) ?? 0,

    totalFunds: num(r.total_funds) ?? 0,

    tuitionRevenue: num(r.tuition_revenue) ?? 0,

    fundSecureRate: num(r.fund_secure_rate) ?? 0,

  };

}



type RawFilterRow = {
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  region: string;
};



export async function loadFundSecureRateDashboard(

  query: FundSecureRateQuery = {},

): Promise<FundSecureRateDashboardData> {

  const [raw, divisionLookup] = await Promise.all([

    readCsvFile("financeAnalysisFundSecureRate").catch(() => []),

    loadSchoolDivisionLookup(),

  ]);



  const rolledUp = await rollupCsvRowsToMainCampus(
    raw,
    FUND_SECURE_MAIN_CAMPUS_SPEC,
  );
  const enriched = enrichRowsWithSchoolDivision(rolledUp, divisionLookup);



  const yearSet = new Set<number>();

  let uploadedAt: string | null = null;



  for (const r of enriched) {

    const year = num(r.year);

    if (year) yearSet.add(year);

    const at = r.uploaded_at?.trim();

    if (at && (!uploadedAt || at > uploadedAt)) {

      uploadedAt = at;

    }

  }



  const years = [...yearSet].sort((a, b) => a - b);

  const section: FundSecureRateSection =
    query.section === "charts" ? "charts" : "data";

  const allRows: FundSecureRateRow[] = [];
  if (section === "charts") {
    for (const r of enriched) {
      const parsed = parseRow(r);
      if (parsed) allRows.push(parsed);
    }
    allRows.sort(
      (a, b) =>
        a.year - b.year ||
        a.schoolName.localeCompare(b.schoolName, "ko"),
    );
  }

  const advancedChartRows = allRows;

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

  const rows: FundSecureRateRow[] = [];



  if (displayYear != null) {

    for (const r of enriched) {

      const year = num(r.year);

      const schoolName = r.school_name?.trim();

      if (!year || !schoolName || year !== displayYear) continue;



      const schoolKind = r.school_kind ?? "";
      const estb = r.estb ?? "";
      const schoolDivision = r.school_division ?? "";
      const region = r.region ?? "";

      yearRowCount += 1;
      optionRows.push({ estb, schoolKind, schoolDivision, region });
      if (estb) estbSet.add(estb);
      if (schoolDivision) schoolDivisionSet.add(schoolDivision);
      if (region) regionSet.add(region);
    }

    const tableFilters = {
      estb: estbFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKinds: schoolKindsFilter,
      regions: regionsFilter,
      search: searchFilter,
    };



    for (const r of enriched) {

      const year = num(r.year);

      const schoolName = r.school_name?.trim();

      if (!year || !schoolName || year !== displayYear) continue;



      if (

        !rowMatchesTableFilters(
          {
            estb: r.estb ?? "",
            schoolKind: r.school_kind ?? "",
            schoolDivision: r.school_division ?? "",
            region: r.region ?? "",
            schoolName,
          },
          tableFilters,
        )

      ) {

        continue;

      }



      const parsed = parseRow(r);

      if (parsed) rows.push(parsed);

    }

  }



  const schoolKindSet = getTableSchoolKindOptions(
    optionRows,
    estbFilter,
    schoolDivisionFilter,
  );



  rows.sort(

    (a, b) =>

      a.schoolName.localeCompare(b.schoolName, "ko") ||

      a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko"),

  );



  return {

    years,

    displayYear,

    rows,

    allRows,

    advancedChartRows,

    section,

    filterOptions: {
      estbs: sortKo([...estbSet]),
      schoolKinds: schoolKindSet,
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



export function parseFundSecureRateQuery(searchParams: {
  year?: string;
  estb?: string;
  schoolKind?: string;
  schoolDivision?: string;
  region?: string;
  search?: string;
  section?: string;
}): FundSecureRateQuery {
  const year = Number(searchParams.year);
  const section =
    searchParams.section === "charts" ? "charts" : "data";
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

