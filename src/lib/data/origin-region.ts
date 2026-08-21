import { readCsvFile } from "@/lib/csv/read";
import { getTableSchoolKindOptions, resolveSchoolKindDivision } from "@/lib/analysis/school-division";
import {
  parseMultiFilterParam,
  rowMatchesTableFilters,
} from "@/lib/analysis/table-filter-utils";
import {
  ORIGIN_REGION_REGION_CSV_KEYS,
  ORIGIN_REGION_REGION_GROUPS,
  type OriginRegionCategoryCell,
  type OriginRegionCategoryKey,
  type OriginRegionRow,
} from "@/lib/ingest/origin-region-config";
import {
  loadSchoolDivisionLookup,
  type SchoolDivisionLookup,
} from "@/lib/ingest/school-code-lookup";

export type OriginRegionQuery = {
  year?: number | null;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
};

export type OriginRegionFilterOptions = {
  estbs: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
  regions: string[];
};

export type OriginRegionDashboardData = {
  years: number[];
  displayYear: number | null;
  rows: OriginRegionRow[];
  filterOptions: OriginRegionFilterOptions;
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

function deriveSchoolDivision(
  schoolKind: string,
  year: number,
  schoolCodeStd: string,
  lookup: SchoolDivisionLookup,
): string {
  const fromCode = schoolCodeStd
    ? lookup.lookupByStd(year, schoolCodeStd)
    : "";
  return fromCode || resolveSchoolKindDivision(schoolKind) || "";
}

function parseByRegion(
  r: Record<string, string>,
  totalEnrolled: number,
): Record<OriginRegionCategoryKey, OriginRegionCategoryCell> {
  const byRegion = {} as Record<OriginRegionCategoryKey, OriginRegionCategoryCell>;
  for (const g of ORIGIN_REGION_REGION_GROUPS) {
    if (g.key === "town_special_other") {
      const mergedCount = num(r.town_special_other_count);
      const mergedRatio = num(r.town_special_other_ratio);
      if (mergedCount != null || mergedRatio != null) {
        byRegion[g.key] = {
          count: mergedCount ?? 0,
          ratio: mergedRatio ?? 0,
        };
        continue;
      }

      const legacyCount =
        (num(r.town_count) ?? 0) +
        (num(r.special_count) ?? 0) +
        (num(r.other_count) ?? 0);
      const legacyRatio =
        totalEnrolled > 0
          ? (legacyCount / totalEnrolled) * 100
          : (num(r.town_ratio) ?? 0) +
            (num(r.special_ratio) ?? 0) +
            (num(r.other_ratio) ?? 0);
      byRegion[g.key] = { count: legacyCount, ratio: legacyRatio };
      continue;
    }

    const keys = ORIGIN_REGION_REGION_CSV_KEYS[g.key];
    byRegion[g.key] = {
      count: num(r[keys.count]) ?? 0,
      ratio: num(r[keys.ratio]) ?? 0,
    };
  }
  return byRegion;
}

function parseRow(
  r: Record<string, string>,
  lookup: SchoolDivisionLookup,
): OriginRegionRow | null {
  const year = num(r.year);
  const schoolName = r.school_name?.trim();
  if (!year || !schoolName) return null;

  const schoolKind = r.school_kind ?? "";
  const schoolCodeStd = r.school_code_std?.trim() ?? "";
  const totalEnrolled = num(r.total_enrolled) ?? 0;

  return {
    year,
    schoolCodeStd,
    schoolKind,
    estb: r.estb ?? "",
    schoolDivision: deriveSchoolDivision(
      schoolKind,
      year,
      schoolCodeStd,
      lookup,
    ),
    region: r.region ?? "",
    schoolName,
    totalEnrolled,
    byRegion: parseByRegion(r, totalEnrolled),
  };
}

type RawFilterRow = {
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  region: string;
};

export async function loadOriginRegionDashboard(
  query: OriginRegionQuery = {},
): Promise<OriginRegionDashboardData> {
  const [raw, divisionLookup] = await Promise.all([
    readCsvFile("financeAnalysisOriginRegion").catch(() => []),
    loadSchoolDivisionLookup(),
  ]);

  const yearSet = new Set<number>();
  let uploadedAt: string | null = null;

  for (const r of raw) {
    const year = num(r.year);
    if (year) yearSet.add(year);
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) {
      uploadedAt = at;
    }
  }

  const years = [...yearSet].sort((a, b) => a - b);
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
  const rows: OriginRegionRow[] = [];

  if (displayYear != null) {
    for (const r of raw) {
      const year = num(r.year);
      const schoolName = r.school_name?.trim();
      if (!year || !schoolName || year !== displayYear) continue;

      const schoolKind = r.school_kind ?? "";
      const schoolCodeStd = r.school_code_std?.trim() ?? "";
      const estb = r.estb ?? "";
      const schoolDivision = deriveSchoolDivision(
        schoolKind,
        year,
        schoolCodeStd,
        divisionLookup,
      );
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

    for (const r of raw) {
      const year = num(r.year);
      const schoolName = r.school_name?.trim();
      if (!year || !schoolName || year !== displayYear) continue;

      const schoolKind = r.school_kind ?? "";
      const schoolCodeStd = r.school_code_std?.trim() ?? "";
      const schoolDivision = deriveSchoolDivision(
        schoolKind,
        year,
        schoolCodeStd,
        divisionLookup,
      );

      if (
        !rowMatchesTableFilters(
          {
            estb: r.estb ?? "",
            schoolKind,
            schoolDivision,
            region: r.region ?? "",
            schoolName,
          },
          tableFilters,
        )
      ) {
        continue;
      }

      const parsed = parseRow(r, divisionLookup);
      if (parsed) rows.push(parsed);
    }
  }

  const schoolKindOptions = getTableSchoolKindOptions(
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
    filterOptions: {
      estbs: sortKo([...estbSet]),
      schoolDivisions: sortKo([...schoolDivisionSet]),
      schoolKinds: schoolKindOptions,
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
    rowCount: raw.length,
  };
}

export function parseOriginRegionQuery(searchParams: {
  year?: string;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
}): OriginRegionQuery {
  const year = Number(searchParams.year);
  return {
    year: Number.isFinite(year) ? year : null,
    estb: searchParams.estb,
    schoolDivision: searchParams.schoolDivision,
    schoolKind: searchParams.schoolKind,
    region: searchParams.region,
    search: searchParams.search,
  };
}
