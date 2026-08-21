import { readCsvFile } from "@/lib/csv/read";
import { matchSidoRegion, findSidoById } from "@/lib/analysis/korea-sido-regions";
import type { SidoRegion } from "@/lib/analysis/korea-sido-regions";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";

export type UniversityLocationsQuery = {
  sidoId?: string;
  sigungu?: string;
};

export type UniversityLocationsDashboardData = {
  rows: UniversityLocationRow[];
  allRows: UniversityLocationRow[];
  filters: {
    sidoId: string;
    sigungu: string;
  };
  selectedSido: SidoRegion | null;
  sigunguOptions: string[];
  hasData: boolean;
  geocodedAt: string | null;
  rowCount: number;
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRow(r: Record<string, string>): UniversityLocationRow | null {
  const lng = num(r.lng);
  const lat = num(r.lat);
  const schoolName = r.school_name?.trim();
  if (!schoolName || lng == null || lat == null) return null;

  return {
    schoolCodeStd: r.school_code_std?.trim() ?? "",
    schoolName,
    mainBranch: r.main_branch?.trim() ?? "",
    schoolType: r.school_type?.trim() ?? "",
    establishment: r.establishment?.trim() ?? "",
    roadAddress: r.road_address?.trim() ?? "",
    lotAddress: r.lot_address?.trim() ?? "",
    sido: r.sido?.trim() ?? "",
    sigungu: r.sigungu?.trim() ?? "",
    lng,
    lat,
  };
}

function matchesSido(row: UniversityLocationRow, sido: SidoRegion): boolean {
  const matched = matchSidoRegion(row.sido);
  if (matched) return matched.id === sido.id;
  return row.sido.includes(sido.shortLabel);
}

export async function loadUniversityLocationsDashboard(
  query: UniversityLocationsQuery = {},
): Promise<UniversityLocationsDashboardData> {
  const raw = await readCsvFile("univMapUniversityLocations").catch(() => []);

  let geocodedAt: string | null = null;
  const allRows: UniversityLocationRow[] = [];

  for (const r of raw) {
    const at = r.geocoded_at?.trim();
    if (at && (!geocodedAt || at > geocodedAt)) geocodedAt = at;
    const parsed = parseRow(r);
    if (parsed) allRows.push(parsed);
  }

  allRows.sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));

  const sidoId = query.sidoId?.trim() ?? "";
  const sigunguFilter = query.sigungu?.trim() ?? "";
  const selectedSido = findSidoById(sidoId);

  const sigunguSet = new Set<string>();
  if (selectedSido) {
    for (const row of allRows) {
      if (matchesSido(row, selectedSido) && row.sigungu) {
        sigunguSet.add(row.sigungu);
      }
    }
  }

  const rows = allRows.filter((row) => {
    if (selectedSido && !matchesSido(row, selectedSido)) return false;
    if (sigunguFilter && row.sigungu !== sigunguFilter) return false;
    return true;
  });

  return {
    rows,
    allRows,
    filters: { sidoId, sigungu: sigunguFilter },
    selectedSido,
    sigunguOptions: [...sigunguSet].sort((a, b) => a.localeCompare(b, "ko")),
    hasData: allRows.length > 0,
    geocodedAt,
    rowCount: raw.length,
  };
}

export function parseUniversityLocationsQuery(searchParams: {
  sido?: string;
  sigungu?: string;
}): UniversityLocationsQuery {
  return {
    sidoId: searchParams.sido,
    sigungu: searchParams.sigungu,
  };
}
