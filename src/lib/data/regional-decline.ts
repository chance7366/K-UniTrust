import { gradeFromExtinctionIndex } from "@/lib/analysis/regional-decline-grade";
import { readCsvFile } from "@/lib/csv/read";
import {
  pickDefaultDisplayYears,
  regionalDeclineRegionSortKey,
} from "@/lib/ingest/regional-decline-config";

export type RegionalDeclineCell = {
  index: number;
  grade: number;
  women2039?: number | null;
  senior65?: number | null;
} | null;

export type RegionalDeclineRow = {
  region: string;
  regionCode: string;
  byYear: Record<number, RegionalDeclineCell>;
};

export type RegionalDeclineSigunguRow = {
  sido: string;
  name: string;
  fullName: string;
  regionCode: string;
  byYear: Record<number, RegionalDeclineCell>;
};

export type RegionalDeclineDashboardData = {
  years: number[];
  defaultDisplayYears: number[];
  rows: RegionalDeclineRow[];
  sigunguRows: RegionalDeclineSigunguRow[];
  sidoCount: number;
  sigunguCount: number;
  hasData: boolean;
  uploadedAt: string | null;
  rowCount: number;
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function makeCell(index: number, women: number | null, senior: number | null) {
  return {
    index,
    grade: gradeFromExtinctionIndex(index),
    women2039: women,
    senior65: senior,
  };
}

export async function loadRegionalDeclineDashboard(): Promise<RegionalDeclineDashboardData> {
  const raw = await readCsvFile("financeAnalysisRegionalDecline").catch(
    () => [],
  );

  const yearSet = new Set<number>();
  const sidoMap = new Map<string, RegionalDeclineRow>();
  const sigunguMap = new Map<string, RegionalDeclineSigunguRow>();
  let uploadedAt: string | null = null;

  for (const r of raw) {
    const year = num(r.year);
    const geoLevel = r.geo_level?.trim();
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) uploadedAt = at;
    if (!year) continue;

    const index = num(r.extinction_index);
    if (index == null) continue;

    yearSet.add(year);
    const storedGrade = num(r.extinction_grade);
    const cell = {
      index,
      grade:
        storedGrade != null
          ? Math.round(storedGrade)
          : gradeFromExtinctionIndex(index),
      women2039: num(r.women_20_39),
      senior65: num(r.senior_65_plus),
    };

    if (geoLevel === "sido") {
      const region = r.sido?.trim() || r.region?.trim();
      if (!region) continue;
      let entry = sidoMap.get(region);
      if (!entry) {
        entry = {
          region,
          regionCode: r.region_code ?? "",
          byYear: {},
        };
        sidoMap.set(region, entry);
      }
      if (!entry.regionCode && r.region_code) entry.regionCode = r.region_code;
      entry.byYear[year] = cell;
      continue;
    }

    if (geoLevel === "sigungu") {
      const sido = r.sido?.trim();
      const name = r.region?.trim();
      if (!sido || !name) continue;
      const key = `${sido}::${r.region_code || name}`;
      let entry = sigunguMap.get(key);
      if (!entry) {
        entry = {
          sido,
          name,
          fullName: r.region_full ?? name,
          regionCode: r.region_code ?? "",
          byYear: {},
        };
        sigunguMap.set(key, entry);
      }
      entry.fullName = r.region_full || entry.fullName;
      entry.name = name;
      if (r.region_code) entry.regionCode = r.region_code;
      entry.byYear[year] = cell;
    }
  }

  const years = [...yearSet].sort((a, b) => a - b);

  const sidoRows = [...sidoMap.values()].sort(
    (a, b) =>
      regionalDeclineRegionSortKey(a.region) -
        regionalDeclineRegionSortKey(b.region) ||
      a.region.localeCompare(b.region, "ko"),
  );

  const nationalByYear: Record<number, NonNullable<RegionalDeclineCell>> = {};
  for (const year of years) {
    let women = 0;
    let senior = 0;
    let has = false;
    for (const row of sidoRows) {
      const cell = row.byYear[year];
      if (!cell || cell.women2039 == null || cell.senior65 == null) continue;
      women += cell.women2039;
      senior += cell.senior65;
      has = true;
    }
    if (!has || senior <= 0) continue;
    nationalByYear[year] = makeCell((women / senior) * 100, women, senior);
  }

  const rows: RegionalDeclineRow[] = [
    { region: "전국", regionCode: "00", byYear: nationalByYear },
    ...sidoRows,
  ];

  const sigunguRows = [...sigunguMap.values()].sort(
    (a, b) =>
      regionalDeclineRegionSortKey(a.sido) -
        regionalDeclineRegionSortKey(b.sido) ||
      a.name.localeCompare(b.name, "ko"),
  );

  return {
    years,
    defaultDisplayYears: pickDefaultDisplayYears(years),
    rows,
    sigunguRows,
    sidoCount: sidoRows.length,
    sigunguCount: sigunguRows.length,
    hasData: sidoRows.length > 0 || sigunguRows.length > 0,
    uploadedAt,
    rowCount: raw.length,
  };
}
