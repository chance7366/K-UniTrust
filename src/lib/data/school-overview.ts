import { readCsvFile } from "@/lib/csv/read";
import { loadSchoolKindLookup } from "@/lib/ingest/school-code-lookup";
import type { SchoolOverviewRow } from "@/lib/ingest/school-overview-config";
import { SCHOOL_OVERVIEW_BASE_DATE } from "@/lib/ingest/school-overview-config";

export type SchoolOverviewQuery = {
  region?: string;
  schoolType?: string;
  schoolKind?: string;
  establishment?: string;
  schoolStatus?: string;
  q?: string;
};

export type SchoolOverviewFilterOptions = {
  establishments: string[];
  schoolTypes: string[];
  schoolKinds: string[];
  regions: string[];
  schoolStatuses: string[];
};

export type SchoolOverviewDashboardData = {
  rows: SchoolOverviewRow[];
  filterOptions: SchoolOverviewFilterOptions;
  filters: {
    region: string;
    schoolType: string;
    schoolKind: string;
    establishment: string;
    schoolStatus: string;
    q: string;
  };
  stats: {
    total: number;
    active: number;
    closed: number;
    filtered: number;
  };
  hasData: boolean;
  uploadedAt: string | null;
  rowCount: number;
  baseDate: string;
};

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function matchesFilter(value: string, filter: string): boolean {
  return !filter || value === filter;
}

function parseRow(
  r: Record<string, string>,
  schoolKindLookup: (code: string) => string,
): SchoolOverviewRow | null {
  const schoolCodeStd = r.school_code_std?.trim();
  const schoolName = r.school_name?.trim();
  if (!schoolCodeStd || !schoolName) return null;

  return {
    schoolCodeStd,
    schoolName,
    mainBranch: r.main_branch ?? "",
    schoolType: r.school_type ?? "",
    schoolKind: schoolKindLookup(schoolCodeStd),
    region: r.region ?? "",
    establishment: r.establishment ?? "",
    relatedLaw: r.related_law ?? "",
    corpName: r.corp_name ?? "",
    schoolStatus: r.school_status ?? "",
    schoolNameEn: r.school_name_en ?? "",
    roadAddress: r.road_address ?? "",
    lotAddress: r.lot_address ?? "",
    zipCode: r.zip_code ?? "",
    foundedDate: r.founded_date ?? "",
    homepage: r.homepage ?? "",
  };
}

export async function loadSchoolOverviewDashboard(
  query: SchoolOverviewQuery = {},
): Promise<SchoolOverviewDashboardData> {
  const [raw, schoolKindLookup] = await Promise.all([
    readCsvFile("univMapSchoolOverview").catch(() => []),
    loadSchoolKindLookup(),
  ]);

  let uploadedAt: string | null = null;
  const allRows: SchoolOverviewRow[] = [];

  for (const r of raw) {
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) {
      uploadedAt = at;
    }
    const parsed = parseRow(r, (code) => schoolKindLookup.lookupByStd(code));
    if (parsed) allRows.push(parsed);
  }

  const establishmentFilter = query.establishment?.trim() ?? "";
  const schoolTypeFilter = query.schoolType?.trim() ?? "";
  const schoolKindFilter = query.schoolKind?.trim() ?? "";
  const regionFilter = query.region?.trim() ?? "";
  const schoolStatusFilter = query.schoolStatus?.trim() ?? "";
  const q = query.q?.trim().toLowerCase() ?? "";

  const establishmentSet = new Set<string>();
  const schoolTypeSet = new Set<string>();
  const schoolKindSet = new Set<string>();
  const regionSet = new Set<string>();
  const schoolStatusSet = new Set<string>();

  for (const row of allRows) {
    if (row.establishment) establishmentSet.add(row.establishment);
    if (row.schoolType) schoolTypeSet.add(row.schoolType);
    if (row.schoolKind) schoolKindSet.add(row.schoolKind);
    if (row.region) regionSet.add(row.region);
    if (row.schoolStatus) schoolStatusSet.add(row.schoolStatus);
  }

  const rows = allRows.filter((row) => {
    if (!matchesFilter(row.establishment, establishmentFilter)) return false;
    if (!matchesFilter(row.schoolType, schoolTypeFilter)) return false;
    if (!matchesFilter(row.schoolKind, schoolKindFilter)) return false;
    if (!matchesFilter(row.region, regionFilter)) return false;
    if (!matchesFilter(row.schoolStatus, schoolStatusFilter)) return false;
    if (!q) return true;
    return (
      row.schoolName.toLowerCase().includes(q) ||
      row.schoolCodeStd.includes(q) ||
      row.schoolNameEn.toLowerCase().includes(q)
    );
  });

  rows.sort(
    (a, b) =>
      a.schoolName.localeCompare(b.schoolName, "ko") ||
      a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko"),
  );

  const activeCount = allRows.filter((r) => r.schoolStatus === "기존").length;
  const closedCount = allRows.filter((r) => r.schoolStatus === "폐교").length;

  return {
    rows,
    filterOptions: {
      establishments: sortKo([...establishmentSet]),
      schoolTypes: sortKo([...schoolTypeSet]),
      schoolKinds: sortKo([...schoolKindSet]),
      regions: sortKo([...regionSet]),
      schoolStatuses: sortKo([...schoolStatusSet]),
    },
    filters: {
      region: regionFilter,
      schoolType: schoolTypeFilter,
      schoolKind: schoolKindFilter,
      establishment: establishmentFilter,
      schoolStatus: schoolStatusFilter,
      q,
    },
    stats: {
      total: allRows.length,
      active: activeCount,
      closed: closedCount,
      filtered: rows.length,
    },
    hasData: allRows.length > 0,
    uploadedAt,
    rowCount: raw.length,
    baseDate: SCHOOL_OVERVIEW_BASE_DATE,
  };
}

export function parseSchoolOverviewQuery(searchParams: {
  region?: string;
  schoolType?: string;
  schoolKind?: string;
  establishment?: string;
  schoolStatus?: string;
  mainBranch?: string;
  q?: string;
}): SchoolOverviewQuery {
  return {
    region: searchParams.region,
    schoolType: searchParams.schoolType,
    schoolKind: searchParams.schoolKind,
    establishment: searchParams.establishment,
    schoolStatus: searchParams.schoolStatus,
    q: searchParams.q,
  };
}
