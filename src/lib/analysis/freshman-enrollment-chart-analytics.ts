import { ANALYTICS_ZONES, zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import type { FreshmanEnrollmentRow } from "@/lib/ingest/freshman-enrollment-config";
import {
  normalizeEstbGroup,
  resolveSchoolDivisionFromFields,
  resolveSchoolKindDivision,
} from "@/lib/analysis/school-division";

export type FreshmanChartDbType = "campus" | "consolidated";

export type FreshmanChartYearFilter = "all" | string;

export type FreshmanChartEstbFilter = "all" | "국공립" | "사립";

export type FreshmanChartSchoolDivFilter = "all" | "대학" | "전문대학";

export type FreshmanChartRegionCategory =
  | "all"
  | "metro"
  | "zones"
  | "sido";

export type FreshmanChartFilters = {
  year: FreshmanChartYearFilter;
  estb: FreshmanChartEstbFilter;
  schoolDivision: FreshmanChartSchoolDivFilter;
  schoolKinds: string[];
  regions: string[];
  regionCategory: FreshmanChartRegionCategory;
};

export type FreshmanChartKpis = {
  withinRate: number | null;
  withinYoy: number | null;
  totalRate: number | null;
  totalYoy: number | null;
  metroWithin: number | null;
  nonMetroWithin: number | null;
  metroGap: number | null;
  highestZone: { name: string; rate: number } | null;
  lowestZone: { name: string; rate: number } | null;
};

export type FreshmanYearTrendPoint = {
  year: string;
  within: number | null;
  withinOutside: number | null;
};

export type FreshmanRegionBarPoint = {
  region: string;
  within: number | null;
  withinOutside: number | null;
};

export type FreshmanEstbDivBarPoint = {
  group: string;
  within: number | null;
  withinOutside: number | null;
};

export type FreshmanChartMetrics = {
  kpis: FreshmanChartKpis;
  yearTrend: FreshmanYearTrendPoint[];
  regionBars: FreshmanRegionBarPoint[];
  estbDivBars: FreshmanEstbDivBarPoint[];
  sidoBars: FreshmanRegionBarPoint[];
  sidoBaseline: number | null;
  referenceYear: number;
};

const METRO_REGIONS = new Set(["서울", "경기", "인천"]);

const SIDO_ORDER = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

function sumFillRate(
  rows: FreshmanEnrollmentRow[],
  mode: "within" | "total",
): number | null {
  if (!rows.length) return null;
  let enrolled = 0;
  let recruit = 0;
  for (const row of rows) {
    if (mode === "within") {
      enrolled += Number(row.enrolled.within) || 0;
      recruit += Number(row.recruit.within) || 0;
    } else {
      enrolled += Number(row.enrolled.total) || 0;
      recruit += Number(row.recruit.total) || 0;
    }
  }
  if (!recruit) return null;
  return Math.round((enrolled / recruit) * 10000) / 100;
}

function zoneForRegion(region: string) {
  return zoneForSido(region);
}

function filterEligibleRows(rows: FreshmanEnrollmentRow[]): FreshmanEnrollmentRow[] {
  return rows.filter((row) => {
    if (!normalizeEstbGroup(row.estb)) return false;
    return (
      resolveSchoolDivisionFromFields(row.schoolKind ?? "", row.schoolDivision ?? "") !=
      null
    );
  });
}

export function getFreshmanChartSchoolKindOptions(
  rows: FreshmanEnrollmentRow[],
  estb: FreshmanChartEstbFilter,
  schoolDivision: FreshmanChartSchoolDivFilter,
): string[] {
  const kinds = new Set<string>();
  for (const row of filterEligibleRows(rows)) {
    if (estb !== "all" && normalizeEstbGroup(row.estb) !== estb) continue;
    if (schoolDivision !== "all") {
      const kindDiv = resolveSchoolKindDivision(row.schoolKind ?? "");
      if (kindDiv !== schoolDivision) continue;
    }
    if (row.schoolKind) kinds.add(row.schoolKind);
  }
  return [...kinds].sort((a, b) => a.localeCompare(b, "ko"));
}

export function filterFreshmanChartRows(
  rows: FreshmanEnrollmentRow[],
  filters: FreshmanChartFilters,
): FreshmanEnrollmentRow[] {
  return filterEligibleRows(rows).filter((row) => {
    if (filters.year !== "all" && row.year !== Number(filters.year)) return false;

    const estbGroup = normalizeEstbGroup(row.estb);
    if (filters.estb !== "all" && estbGroup !== filters.estb) return false;

    const schoolDiv = resolveSchoolDivisionFromFields(
      row.schoolKind ?? "",
      row.schoolDivision ?? "",
    );
    if (filters.schoolDivision !== "all" && schoolDiv !== filters.schoolDivision) {
      return false;
    }

    if (
      filters.schoolKinds.length > 0 &&
      !filters.schoolKinds.includes(row.schoolKind)
    ) {
      return false;
    }
    if (filters.regions.length > 0 && !filters.regions.includes(row.region)) {
      return false;
    }

    return true;
  });
}

function resolveReferenceYear(
  rows: FreshmanEnrollmentRow[],
  yearFilter: FreshmanChartYearFilter,
): number {
  if (yearFilter !== "all") return Number(yearFilter);
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
  return years[0] ?? new Date().getFullYear();
}

function yoyDelta(
  rows: FreshmanEnrollmentRow[],
  year: number,
  mode: "within" | "total",
): number | null {
  const current = sumFillRate(
    rows.filter((r) => r.year === year),
    mode,
  );
  const prev = sumFillRate(
    rows.filter((r) => r.year === year - 1),
    mode,
  );
  if (current == null || prev == null) return null;
  return Math.round((current - prev) * 100) / 100;
}

function buildRegionBars(
  rows: FreshmanEnrollmentRow[],
  regionCategory: FreshmanChartRegionCategory,
): FreshmanRegionBarPoint[] {
  if (regionCategory === "metro") {
    return [
      {
        region: "수도권",
        within: sumFillRate(
          rows.filter((r) => METRO_REGIONS.has(r.region)),
          "within",
        ),
        withinOutside: sumFillRate(
          rows.filter((r) => METRO_REGIONS.has(r.region)),
          "total",
        ),
      },
      {
        region: "비수도권",
        within: sumFillRate(
          rows.filter((r) => !METRO_REGIONS.has(r.region)),
          "within",
        ),
        withinOutside: sumFillRate(
          rows.filter((r) => !METRO_REGIONS.has(r.region)),
          "total",
        ),
      },
    ];
  }

  if (regionCategory === "sido") {
    return SIDO_ORDER.map((region) => ({
      region,
      within: sumFillRate(
        rows.filter((r) => r.region === region),
        "within",
      ),
      withinOutside: sumFillRate(
        rows.filter((r) => r.region === region),
        "total",
      ),
    })).filter((p) => p.within != null || p.withinOutside != null);
  }

  return ANALYTICS_ZONES.map((zone) => {
    const zoneRows = rows.filter((r) => zoneForRegion(r.region) === zone);
    return {
      region: zone,
      within: sumFillRate(zoneRows, "within"),
      withinOutside: sumFillRate(zoneRows, "total"),
    };
  });
}

function buildEstbDivBars(rows: FreshmanEnrollmentRow[]): FreshmanEstbDivBarPoint[] {
  const groups: { key: string; estb: "국공립" | "사립"; div: "대학" | "전문대학" }[] = [
    { key: "국공립 · 대학", estb: "국공립", div: "대학" },
    { key: "국공립 · 전문대학", estb: "국공립", div: "전문대학" },
    { key: "사립 · 대학", estb: "사립", div: "대학" },
    { key: "사립 · 전문대학", estb: "사립", div: "전문대학" },
  ];

  return groups.map(({ key, estb, div }) => {
    const matched = rows.filter((row) => {
      const estbGroup = normalizeEstbGroup(row.estb);
      const schoolDiv = resolveSchoolDivisionFromFields(
        row.schoolKind ?? "",
        row.schoolDivision ?? "",
      );
      return estbGroup === estb && schoolDiv === div;
    });
    return {
      group: key,
      within: sumFillRate(matched, "within"),
      withinOutside: sumFillRate(matched, "total"),
    };
  });
}

function buildSidoBars(rows: FreshmanEnrollmentRow[]): FreshmanRegionBarPoint[] {
  const points = SIDO_ORDER.map((region) => ({
    region,
    within: sumFillRate(
      rows.filter((r) => r.region === region),
      "within",
    ),
    withinOutside: sumFillRate(
      rows.filter((r) => r.region === region),
      "total",
    ),
  })).filter((p) => p.within != null);

  return points.sort((a, b) => (b.within ?? 0) - (a.within ?? 0));
}

export function buildFreshmanChartMetrics(
  rows: FreshmanEnrollmentRow[],
  filters: FreshmanChartFilters,
  options?: { years?: number[] },
): FreshmanChartMetrics {
  const filtered = filterFreshmanChartRows(rows, filters);
  const referenceYear = resolveReferenceYear(filtered, filters.year);
  const yearScoped =
    filters.year === "all"
      ? filtered
      : filtered.filter((r) => r.year === referenceYear);

  const withinRate = sumFillRate(yearScoped, "within");
  const totalRate = sumFillRate(yearScoped, "total");

  const metroWithin = sumFillRate(
    yearScoped.filter((r) => METRO_REGIONS.has(r.region)),
    "within",
  );
  const nonMetroWithin = sumFillRate(
    yearScoped.filter((r) => !METRO_REGIONS.has(r.region)),
    "within",
  );
  const metroGap =
    metroWithin != null && nonMetroWithin != null
      ? Math.round((metroWithin - nonMetroWithin) * 100) / 100
      : null;

  const zoneRates: { name: string; rate: number }[] = [];
  for (const zone of ANALYTICS_ZONES) {
    const zoneRows = yearScoped.filter((r) => zoneForRegion(r.region) === zone);
    const rate = sumFillRate(zoneRows, "within");
    if (rate != null) zoneRates.push({ name: zone, rate });
  }

  const highestZone =
    zoneRates.length > 0
      ? zoneRates.reduce((a, b) => (b.rate > a.rate ? b : a))
      : null;
  const lowestZone =
    zoneRates.length > 0
      ? zoneRates.reduce((a, b) => (b.rate < a.rate ? b : a))
      : null;

  const trendYears = options?.years?.length
    ? [...options.years].sort((a, b) => a - b)
    : [...new Set(filtered.map((r) => r.year))].sort((a, b) => a - b);

  const yearTrend = trendYears.map((year) => ({
    year: String(year),
    within: sumFillRate(
      filtered.filter((r) => r.year === year),
      "within",
    ),
    withinOutside: sumFillRate(
      filtered.filter((r) => r.year === year),
      "total",
    ),
  }));

  const regionCategory =
    filters.regionCategory === "all" ? "zones" : filters.regionCategory;

  return {
    kpis: {
      withinRate,
      withinYoy: yoyDelta(filtered, referenceYear, "within"),
      totalRate,
      totalYoy: yoyDelta(filtered, referenceYear, "total"),
      metroWithin,
      nonMetroWithin,
      metroGap,
      highestZone,
      lowestZone,
    },
    yearTrend,
    regionBars: buildRegionBars(yearScoped, regionCategory),
    estbDivBars: buildEstbDivBars(yearScoped),
    sidoBars: buildSidoBars(yearScoped),
    sidoBaseline: withinRate,
    referenceYear,
  };
}

export function fmtFreshmanPct(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function fmtFreshmanDelta(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value === 0) return "0.0%p";
  const arrow = value > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%p`;
}
