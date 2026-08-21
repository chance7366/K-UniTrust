import { readCsvFile } from "@/lib/csv/read";
import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import {
  parseMultiFilterParam,
  rowMatchesTableFilters,
} from "@/lib/analysis/table-filter-utils";
import {
  enrichRowsWithSchoolDivision,
  loadSchoolDivisionLookup,
} from "@/lib/ingest/school-code-lookup";
import type { DropoutRateRow } from "@/lib/ingest/dropout-rate-config";
import type { DropoutRateConsolidatedRow } from "@/lib/ingest/dropout-rate-consolidated-config";

export type DropoutRateViewMode = "campus" | "consolidated";

export type DropoutRateSection = "charts" | "data";

export type DropoutRateQuery = {
  year?: number | null;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
  view?: DropoutRateViewMode;
  section?: DropoutRateSection;
};

export type DropoutRateFilterOptions = {
  estbs: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
  regions: string[];
};

export type DropoutRateYearStatus = {
  year: number;
  hasCampusData: boolean;
  hasConsolidatedData: boolean;
  campusRowCount: number;
  consolidatedRowCount: number;
  consolidatedAt: string | null;
};

export type DropoutRateDashboardData = {
  years: number[];
  displayYear: number | null;
  rows: DropoutRateRow[];
  consolidatedRows: DropoutRateConsolidatedRow[];
  allCampusRows: DropoutRateRow[];
  allConsolidatedRows: DropoutRateConsolidatedRow[];
  yearStatuses: DropoutRateYearStatus[];
  viewMode: DropoutRateViewMode;
  section: DropoutRateSection;
  hasAnyConsolidatedData: boolean;
  filterOptions: DropoutRateFilterOptions;
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
  consolidatedRowCount: number;
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function parseCampusRow(r: Record<string, string>): DropoutRateRow | null {
  const year = num(r.year);
  const schoolName = r.school_name?.trim();
  if (!year || !schoolName) return null;

  return {
    year,
    schoolKind: r.school_kind ?? "",
    estb: r.estb ?? "",
    schoolDivision: r.school_division ?? "",
    region: r.region ?? "",
    schoolCodeStd: r.school_code_std ?? "",
    schoolName,
    enrolled: {
      total: num(r.enrolled_students) ?? 0,
      dropouts: num(r.enrolled_dropouts) ?? 0,
      rate: num(r.enrolled_dropout_rate) ?? 0,
    },
    freshman: {
      total: num(r.freshman_students) ?? 0,
      dropouts: num(r.freshman_dropouts) ?? 0,
      rate: num(r.freshman_dropout_rate) ?? 0,
    },
  };
}

function parseConsolidatedRow(
  r: Record<string, string>,
): DropoutRateConsolidatedRow | null {
  const year = num(r.year);
  const schoolName = r.school_rep_name?.trim();
  const repCode = r.school_rep_code?.trim();
  if (!year || !schoolName || !repCode) return null;

  return {
    year,
    schoolKind: r.school_kind ?? "",
    estb: r.estb ?? "",
    schoolDivision: r.school_division ?? "",
    region: r.region ?? "",
    schoolCodeStd: repCode,
    schoolName,
    enrolled: {
      total: num(r.enrolled_students) ?? 0,
      dropouts: num(r.enrolled_dropouts) ?? 0,
      rate: num(r.enrolled_dropout_rate) ?? 0,
    },
    freshman: {
      total: num(r.freshman_students) ?? 0,
      dropouts: num(r.freshman_dropouts) ?? 0,
      rate: num(r.freshman_dropout_rate) ?? 0,
    },
    campusCount: num(r.campus_count) ?? 1,
  };
}

type RawFilterRow = {
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  region: string;
};

function buildYearStatuses(
  campusRaw: Record<string, string>[],
  consolidatedRaw: Record<string, string>[],
): DropoutRateYearStatus[] {
  const campusByYear = new Map<number, number>();
  const consolidatedByYear = new Map<
    number,
    { count: number; at: string | null }
  >();

  for (const r of campusRaw) {
    const year = num(r.year);
    if (!year) continue;
    campusByYear.set(year, (campusByYear.get(year) ?? 0) + 1);
  }

  for (const r of consolidatedRaw) {
    const year = num(r.year);
    if (!year) continue;
    const prev = consolidatedByYear.get(year) ?? { count: 0, at: null };
    const at = r.consolidated_at?.trim() ?? null;
    consolidatedByYear.set(year, {
      count: prev.count + 1,
      at: at && (!prev.at || at > prev.at) ? at : prev.at,
    });
  }

  const years = [
    ...new Set([...campusByYear.keys(), ...consolidatedByYear.keys()]),
  ].sort((a, b) => a - b);

  return years.map((year) => {
    const campusRowCount = campusByYear.get(year) ?? 0;
    const consolidated = consolidatedByYear.get(year);
    return {
      year,
      hasCampusData: campusRowCount > 0,
      hasConsolidatedData: (consolidated?.count ?? 0) > 0,
      campusRowCount,
      consolidatedRowCount: consolidated?.count ?? 0,
      consolidatedAt: consolidated?.at ?? null,
    };
  });
}

export async function loadDropoutRateDashboard(
  query: DropoutRateQuery = {},
): Promise<DropoutRateDashboardData> {
  const [campusRaw, consolidatedRaw, divisionLookup] = await Promise.all([
    readCsvFile("financeAnalysisDropoutRate").catch(() => []),
    readCsvFile("financeAnalysisDropoutRateConsolidated").catch(() => []),
    loadSchoolDivisionLookup(),
  ]);

  const campusEnriched = enrichRowsWithSchoolDivision(
    campusRaw,
    divisionLookup,
  );
  const consolidatedEnriched = enrichRowsWithSchoolDivision(
    consolidatedRaw,
    divisionLookup,
  );

  const yearStatuses = buildYearStatuses(campusEnriched, consolidatedEnriched);

  let uploadedAt: string | null = null;
  for (const r of campusRaw) {
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) {
      uploadedAt = at;
    }
  }

  const years = yearStatuses
    .filter((s) => s.hasCampusData)
    .map((s) => s.year);

  const viewMode: DropoutRateViewMode =
    query.view === "consolidated" ? "consolidated" : "campus";

  const section: DropoutRateSection =
    query.section === "charts" ? "charts" : "data";

  const hasAnyConsolidatedData = yearStatuses.some((s) => s.hasConsolidatedData);

  const allCampusRows: DropoutRateRow[] = [];
  const allConsolidatedRows: DropoutRateConsolidatedRow[] = [];
  if (section === "charts") {
    for (const r of campusEnriched) {
      const parsed = parseCampusRow(r);
      if (parsed) allCampusRows.push(parsed);
    }
    allCampusRows.sort(
      (a, b) =>
        a.year - b.year ||
        a.schoolName.localeCompare(b.schoolName, "ko"),
    );

    for (const r of consolidatedEnriched) {
      const parsed = parseConsolidatedRow(r);
      if (parsed) allConsolidatedRows.push(parsed);
    }
    allConsolidatedRows.sort(
      (a, b) =>
        a.year - b.year ||
        a.schoolName.localeCompare(b.schoolName, "ko"),
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
  const rows: DropoutRateRow[] = [];
  const consolidatedRows: DropoutRateConsolidatedRow[] = [];

  if (displayYear != null) {
    const sourceForFilters =
      viewMode === "consolidated" ? consolidatedEnriched : campusEnriched;

    for (const r of sourceForFilters) {
      const year = num(r.year);
      if (!year || year !== displayYear) continue;

      const schoolKind = r.school_kind ?? "";
      const estb = r.estb ?? "";
      const schoolDivision = r.school_division ?? "";
      const region = r.region ?? "";

      if (viewMode === "campus") {
        const schoolName = r.school_name?.trim();
        if (!schoolName) continue;
        yearRowCount += 1;
      } else if (!r.school_rep_name?.trim()) {
        continue;
      } else {
        yearRowCount += 1;
      }

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

    for (const r of campusEnriched) {
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

      const parsed = parseCampusRow(r);
      if (parsed) rows.push(parsed);
    }

    for (const r of consolidatedEnriched) {
      const year = num(r.year);
      if (!year || year !== displayYear) continue;

      if (
        !rowMatchesTableFilters(
          {
            estb: r.estb ?? "",
            schoolKind: r.school_kind ?? "",
            schoolDivision: r.school_division ?? "",
            region: r.region ?? "",
            schoolName: r.school_rep_name?.trim() ?? "",
          },
          tableFilters,
        )
      ) {
        continue;
      }

      const parsed = parseConsolidatedRow(r);
      if (parsed) consolidatedRows.push(parsed);
    }
  }

  const schoolKindSet = getTableSchoolKindOptions(
    optionRows,
    estbFilter,
    schoolDivisionFilter,
  );

  rows.sort(
    (a, b) =>
      a.schoolName.localeCompare(b.schoolName, "ko"),
  );

  consolidatedRows.sort(
    (a, b) =>
      a.schoolName.localeCompare(b.schoolName, "ko"),
  );

  return {
    years,
    displayYear,
    rows,
    consolidatedRows,
    allCampusRows,
    allConsolidatedRows,
    yearStatuses,
    viewMode,
    section,
    hasAnyConsolidatedData,
    filterOptions: {
      estbs: sortKo([...estbSet]),
      schoolDivisions: sortKo([...schoolDivisionSet]),
      schoolKinds: schoolKindSet,
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
    rowCount: campusEnriched.length,
    consolidatedRowCount: consolidatedEnriched.length,
  };
}

export function parseDropoutRateQuery(searchParams: {
  year?: string;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
  view?: string;
  section?: string;
}): DropoutRateQuery {
  const year = Number(searchParams.year);
  const view =
    searchParams.view === "consolidated" ? "consolidated" : "campus";
  const section =
    searchParams.section === "charts" ? "charts" : "data";
  return {
    year: Number.isFinite(year) ? year : null,
    estb: searchParams.estb,
    schoolDivision: searchParams.schoolDivision,
    schoolKind: searchParams.schoolKind,
    region: searchParams.region,
    search: searchParams.search,
    view,
    section,
  };
}
