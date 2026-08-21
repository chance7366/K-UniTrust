import { readCsvFile } from "@/lib/csv/read";
import {
  getOrCreateYearSliceCache,
  loadYearSlice,
} from "@/lib/csv/year-slice-cache";
import type { SchoolCodeRow } from "@/lib/ingest/school-code-config";

export type SchoolCodeQuery = {
  year?: number | null;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  status?: string;
  q?: string;
};

export type SchoolCodeFilterOptions = {
  estbs: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
  regions: string[];
  statuses: string[];
};

export type SchoolCodeDashboardData = {
  years: number[];
  displayYear: number | null;
  rows: SchoolCodeRow[];
  filterOptions: SchoolCodeFilterOptions;
  yearRowCount: number;
  filters: {
    estb: string;
    schoolDivision: string;
    schoolKind: string;
    region: string;
    status: string;
    q: string;
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

function parseRow(r: Record<string, string>): SchoolCodeRow | null {
  const year = num(r.year);
  const schoolCodeStd = r.school_code_std?.trim();
  const schoolName = r.school_name?.trim();
  if (!year || !schoolCodeStd || !schoolName) return null;

  return {
    year,
    schoolCodeStd,
    schoolName,
    mainBranchName: r.main_branch_name ?? "",
    schoolRepCode: r.school_rep_code ?? "",
    schoolRepName: r.school_rep_name ?? "",
    parentSchoolName: r.parent_school_name ?? "",
    schoolDivision: r.school_division ?? "",
    schoolKind: r.school_kind ?? "",
    region: r.region ?? "",
    estb: r.estb ?? "",
    relatedLaw: r.related_law ?? "",
    corpName: r.corp_name ?? "",
    status: r.status ?? "",
  };
}

function matchesFilter(value: string, filter: string): boolean {
  return !filter || value === filter;
}

function yearOf(r: Record<string, string>): number | null {
  return num(r.year);
}

export async function loadSchoolCodeDashboard(
  query: SchoolCodeQuery = {},
): Promise<SchoolCodeDashboardData> {
  const raw = await readCsvFile("financeAnalysisSchoolCode").catch(() => []);
  const cache = getOrCreateYearSliceCache<SchoolCodeRow>(
    "financeAnalysisSchoolCode",
    "financeAnalysisSchoolCode",
    raw,
    yearOf,
    "asc",
  );

  let uploadedAt: string | null = null;
  for (const r of raw) {
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) {
      uploadedAt = at;
    }
  }

  const years = cache.years;
  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (years.at(-1) ?? null);

  const estbFilter = query.estb?.trim() ?? "";
  const schoolDivisionFilter = query.schoolDivision?.trim() ?? "";
  const schoolKindFilter = query.schoolKind?.trim() ?? "";
  const regionFilter = query.region?.trim() ?? "";
  const statusFilter = query.status?.trim() ?? "";
  const q = query.q?.trim().toLowerCase() ?? "";

  const yearRows =
    displayYear == null
      ? []
      : loadYearSlice(cache, displayYear, () => {
          const rows: SchoolCodeRow[] = [];
          for (const r of raw) {
            if (yearOf(r) !== displayYear) continue;
            const parsed = parseRow(r);
            if (parsed) rows.push(parsed);
          }
          return rows;
        });

  const estbSet = new Set<string>();
  const schoolDivisionSet = new Set<string>();
  const schoolKindSet = new Set<string>();
  const regionSet = new Set<string>();
  const statusSet = new Set<string>();

  for (const row of yearRows) {
    if (row.estb) estbSet.add(row.estb);
    if (row.schoolDivision) schoolDivisionSet.add(row.schoolDivision);
    if (row.schoolKind) schoolKindSet.add(row.schoolKind);
    if (row.region) regionSet.add(row.region);
    if (row.status) statusSet.add(row.status);
  }

  const rows = yearRows.filter((parsed) => {
    if (!matchesFilter(parsed.estb, estbFilter)) return false;
    if (!matchesFilter(parsed.schoolDivision, schoolDivisionFilter)) return false;
    if (!matchesFilter(parsed.schoolKind, schoolKindFilter)) return false;
    if (!matchesFilter(parsed.region, regionFilter)) return false;
    if (!matchesFilter(parsed.status, statusFilter)) return false;
    if (q) {
      const haystack = [
        parsed.schoolName,
        parsed.schoolCodeStd,
        parsed.schoolRepCode,
        parsed.schoolRepName,
        parsed.parentSchoolName,
        parsed.corpName,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  rows.sort(
    (a, b) =>
      a.region.localeCompare(b.region, "ko") ||
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
      schoolKinds: sortKo([...schoolKindSet]),
      regions: sortKo([...regionSet]),
      statuses: sortKo([...statusSet]),
    },
    yearRowCount: yearRows.length,
    filters: {
      estb: estbFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKind: schoolKindFilter,
      region: regionFilter,
      status: statusFilter,
      q,
    },
    hasData: years.length > 0,
    uploadedAt,
    rowCount: raw.length,
  };
}

export function parseSchoolCodeQuery(searchParams: {
  year?: string;
  schoolKind?: string;
  schoolDivision?: string;
  estb?: string;
  region?: string;
  status?: string;
  q?: string;
}): SchoolCodeQuery {
  const year = Number(searchParams.year);
  return {
    year: Number.isFinite(year) ? year : null,
    estb: searchParams.estb,
    schoolDivision: searchParams.schoolDivision,
    schoolKind: searchParams.schoolKind,
    region: searchParams.region,
    status: searchParams.status,
    q: searchParams.q,
  };
}
