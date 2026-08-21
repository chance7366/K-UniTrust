import { readCsvFile } from "@/lib/csv/read";
import {
  SCHOOL_AGE_AGES,
  pickDefaultDisplayYears,
  schoolAgeKey,
  schoolAgeRegionSortKey,
  type SchoolAgeAgeKey,
} from "@/lib/ingest/school-age-population-config";

export type SchoolAgePopulationAges = Record<SchoolAgeAgeKey, number | null>;

export type SchoolAgePopulationYearCell = {
  admissionWeight: number | null;
  ages: SchoolAgePopulationAges;
};

export type SchoolAgePopulationRow = {
  region: string;
  regionCode: string;
  regionFull: string;
  byYear: Record<number, SchoolAgePopulationYearCell>;
};

export type SchoolAgePopulationDashboardData = {
  years: number[];
  defaultDisplayYear: number | null;
  rows: SchoolAgePopulationRow[];
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

export async function loadSchoolAgePopulationDashboard(): Promise<SchoolAgePopulationDashboardData> {
  const raw = await readCsvFile("financeAnalysisSchoolAgePopulation").catch(
    () => [],
  );

  const yearSet = new Set<number>();
  const byRegion = new Map<
    string,
    {
      regionCode: string;
      regionFull: string;
      byYear: Record<number, SchoolAgePopulationYearCell>;
    }
  >();

  for (const r of raw) {
    if (r.age_18 == null || r.age_18 === "") continue;
    const year = num(r.year);
    const region = r.region?.trim();
    if (!year || !region) continue;

    yearSet.add(year);
    let entry = byRegion.get(region);
    if (!entry) {
      entry = {
        regionCode: r.region_code ?? "",
        regionFull: r.region_full ?? region,
        byYear: {},
      };
      byRegion.set(region, entry);
    }
    if (!entry.regionCode && r.region_code) {
      entry.regionCode = r.region_code;
    }
    if (r.region_full) entry.regionFull = r.region_full;

    entry.byYear[year] = {
      admissionWeight: num(r.admission_weight),
      ages: parseAges(r),
    };
  }

  const years = [...yearSet].sort((a, b) => a - b);
  const defaultYears = pickDefaultDisplayYears(years);
  const rows: SchoolAgePopulationRow[] = [...byRegion.entries()]
    .map(([region, { regionCode, regionFull, byYear }]) => ({
      region,
      regionCode,
      regionFull,
      byYear,
    }))
    .sort(
      (a, b) =>
        schoolAgeRegionSortKey(a.region) - schoolAgeRegionSortKey(b.region) ||
        a.region.localeCompare(b.region, "ko"),
    );

  const uploadedAt =
    raw.map((r) => r.uploaded_at).filter(Boolean).sort().at(-1) ?? null;

  return {
    years,
    defaultDisplayYear: defaultYears.at(-1) ?? null,
    rows,
    hasData: rows.length > 0,
    uploadedAt,
    rowCount: raw.length,
  };
}
