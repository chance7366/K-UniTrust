import { readCsvFile } from "@/lib/csv/read";
import type {
  SchoolAgePopulationAges,
  SchoolAgePopulationRow,
  SchoolAgePopulationYearCell,
} from "@/lib/data/school-age-population";
import {
  SCHOOL_AGE_AGES,
  pickDefaultDisplayYears,
  schoolAgeKey,
  schoolAgeRegionSortKey,
} from "@/lib/ingest/school-age-population-config";

export type SchoolAgeSigunguRow = {
  sido: string;
  name: string;
  fullName: string;
  regionCode: string;
  byYear: Record<number, SchoolAgePopulationYearCell>;
};

export type SchoolAgeSigunguDashboardData = {
  years: number[];
  defaultDisplayYear: number | null;
  rows: SchoolAgePopulationRow[];
  sigunguRows: SchoolAgeSigunguRow[];
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

function parseAges(r: Record<string, string>): SchoolAgePopulationAges {
  const ages = {} as SchoolAgePopulationAges;
  for (const age of SCHOOL_AGE_AGES) {
    ages[schoolAgeKey(age)] = num(r[schoolAgeKey(age)]);
  }
  return ages;
}

function emptyAges(): SchoolAgePopulationAges {
  const ages = {} as SchoolAgePopulationAges;
  for (const age of SCHOOL_AGE_AGES) {
    ages[schoolAgeKey(age)] = 0;
  }
  return ages;
}

function sumAges(
  target: SchoolAgePopulationAges,
  source: SchoolAgePopulationAges,
) {
  for (const age of SCHOOL_AGE_AGES) {
    const key = schoolAgeKey(age);
    const v = source[key];
    if (v == null) continue;
    target[key] = (target[key] ?? 0) + v;
  }
}

export async function loadSchoolAgeSigunguDashboard(): Promise<SchoolAgeSigunguDashboardData> {
  const raw = await readCsvFile("univMapSchoolAgePopulationSigungu").catch(
    () => [],
  );

  const yearSet = new Set<number>();
  const sidoMap = new Map<string, SchoolAgePopulationRow>();
  const sigunguMap = new Map<string, SchoolAgeSigunguRow>();
  let uploadedAt: string | null = null;

  for (const r of raw) {
    if (r.age_18 == null || r.age_18 === "") continue;
    const year = num(r.year);
    const geoLevel = r.geo_level?.trim();
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) uploadedAt = at;
    if (!year) continue;

    yearSet.add(year);
    const cell: SchoolAgePopulationYearCell = {
      admissionWeight: null,
      ages: parseAges(r),
    };

    if (geoLevel === "sido") {
      const region = r.sido?.trim() || r.region?.trim();
      if (!region) continue;
      let entry = sidoMap.get(region);
      if (!entry) {
        entry = {
          region,
          regionCode: r.region_code ?? "",
          regionFull: r.region_full ?? region,
          byYear: {},
        };
        sidoMap.set(region, entry);
      }
      if (!entry.regionCode && r.region_code) entry.regionCode = r.region_code;
      if (r.region_full) entry.regionFull = r.region_full;
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
      schoolAgeRegionSortKey(a.region) - schoolAgeRegionSortKey(b.region) ||
      a.region.localeCompare(b.region, "ko"),
  );

  const nationalByYear: Record<number, SchoolAgePopulationYearCell> = {};
  for (const year of years) {
    const ages = emptyAges();
    let has = false;
    for (const row of sidoRows) {
      const cell = row.byYear[year];
      if (!cell) continue;
      sumAges(ages, cell.ages);
      has = true;
    }
    if (!has) continue;
    nationalByYear[year] = { admissionWeight: null, ages };
  }

  const rows: SchoolAgePopulationRow[] = [
    { region: "전국", regionCode: "00", regionFull: "전국", byYear: nationalByYear },
    ...sidoRows,
  ];

  const sigunguRows = [...sigunguMap.values()].sort(
    (a, b) =>
      schoolAgeRegionSortKey(a.sido) - schoolAgeRegionSortKey(b.sido) ||
      a.name.localeCompare(b.name, "ko"),
  );

  const defaultYears = pickDefaultDisplayYears(years);

  return {
    years,
    defaultDisplayYear: defaultYears.at(-1) ?? null,
    rows,
    sigunguRows,
    sidoCount: sidoRows.length,
    sigunguCount: sigunguRows.length,
    hasData: sidoRows.length > 0 || sigunguRows.length > 0,
    uploadedAt,
    rowCount: raw.length,
  };
}
