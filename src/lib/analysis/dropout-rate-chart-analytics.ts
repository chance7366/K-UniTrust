import { ANALYTICS_ZONES, zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import type { DropoutRateRow } from "@/lib/ingest/dropout-rate-config";
import {
  normalizeEstbGroup,
  resolveSchoolDivisionFromFields,
  resolveSchoolKindDivision,
} from "@/lib/analysis/school-division";

export type DropoutChartDbType = "campus" | "consolidated";

export type DropoutChartYearFilter = "all" | string;

export type DropoutChartEstbFilter = "all" | "국공립" | "사립";

export type DropoutChartSchoolDivFilter = "all" | "대학" | "전문대학";

export type DropoutChartRegionCategory =
  | "all"
  | "metro"
  | "zones"
  | "sido";

export type DropoutChartFilters = {
  year: DropoutChartYearFilter;
  estb: DropoutChartEstbFilter;
  schoolDivision: DropoutChartSchoolDivFilter;
  schoolKinds: string[];
  regions: string[];
  regionCategory: DropoutChartRegionCategory;
};

export type DropoutChartKpis = {
  enrolledRate: number | null;
  enrolledYoy: number | null;
  freshmanRate: number | null;
  freshmanYoy: number | null;
  metroEnrolled: number | null;
  nonMetroEnrolled: number | null;
  metroGap: number | null;
  highestZone: { name: string; rate: number } | null;
  lowestZone: { name: string; rate: number } | null;
};

export type DropoutYearTrendPoint = {
  year: string;
  enrolled: number | null;
  freshman: number | null;
};

export type DropoutRegionBarPoint = {
  region: string;
  enrolled: number | null;
  freshman: number | null;
};

export type DropoutEstbDivBarPoint = {
  group: string;
  enrolled: number | null;
  freshman: number | null;
};

export type DropoutChartMetrics = {
  kpis: DropoutChartKpis;
  yearTrend: DropoutYearTrendPoint[];
  regionBars: DropoutRegionBarPoint[];
  estbDivBars: DropoutEstbDivBarPoint[];
  sidoBars: DropoutRegionBarPoint[];
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

function sumDropoutRate(
  rows: DropoutRateRow[],
  mode: "enrolled" | "freshman",
): number | null {
  if (!rows.length) return null;
  let students = 0;
  let dropouts = 0;
  for (const row of rows) {
    const bucket = mode === "enrolled" ? row.enrolled : row.freshman;
    students += Number(bucket.total) || 0;
    dropouts += Number(bucket.dropouts) || 0;
  }
  if (!students) return null;
  return Math.round((dropouts / students) * 10000) / 100;
}

function zoneForRegion(region: string) {
  return zoneForSido(region);
}

function filterEligibleRows(rows: DropoutRateRow[]): DropoutRateRow[] {
  return rows.filter((row) => {
    if (!normalizeEstbGroup(row.estb)) return false;
    return (
      resolveSchoolDivisionFromFields(row.schoolKind ?? "", row.schoolDivision ?? "") !=
      null
    );
  });
}

export function getDropoutChartSchoolKindOptions(
  rows: DropoutRateRow[],
  estb: DropoutChartEstbFilter,
  schoolDivision: DropoutChartSchoolDivFilter,
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

export function filterDropoutChartRows(
  rows: DropoutRateRow[],
  filters: DropoutChartFilters,
): DropoutRateRow[] {
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
  rows: DropoutRateRow[],
  yearFilter: DropoutChartYearFilter,
): number {
  if (yearFilter !== "all") return Number(yearFilter);
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
  return years[0] ?? new Date().getFullYear();
}

function yoyDelta(
  rows: DropoutRateRow[],
  year: number,
  mode: "enrolled" | "freshman",
): number | null {
  const current = sumDropoutRate(
    rows.filter((r) => r.year === year),
    mode,
  );
  const prev = sumDropoutRate(
    rows.filter((r) => r.year === year - 1),
    mode,
  );
  if (current == null || prev == null) return null;
  return Math.round((current - prev) * 100) / 100;
}

function buildRegionBars(
  rows: DropoutRateRow[],
  regionCategory: DropoutChartRegionCategory,
): DropoutRegionBarPoint[] {
  if (regionCategory === "metro") {
    return [
      {
        region: "수도권",
        enrolled: sumDropoutRate(
          rows.filter((r) => METRO_REGIONS.has(r.region)),
          "enrolled",
        ),
        freshman: sumDropoutRate(
          rows.filter((r) => METRO_REGIONS.has(r.region)),
          "freshman",
        ),
      },
      {
        region: "비수도권",
        enrolled: sumDropoutRate(
          rows.filter((r) => !METRO_REGIONS.has(r.region)),
          "enrolled",
        ),
        freshman: sumDropoutRate(
          rows.filter((r) => !METRO_REGIONS.has(r.region)),
          "freshman",
        ),
      },
    ];
  }

  if (regionCategory === "sido") {
    return SIDO_ORDER.map((region) => ({
      region,
      enrolled: sumDropoutRate(
        rows.filter((r) => r.region === region),
        "enrolled",
      ),
      freshman: sumDropoutRate(
        rows.filter((r) => r.region === region),
        "freshman",
      ),
    })).filter((p) => p.enrolled != null || p.freshman != null);
  }

  return ANALYTICS_ZONES.map((zone) => {
    const zoneRows = rows.filter((r) => zoneForRegion(r.region) === zone);
    return {
      region: zone,
      enrolled: sumDropoutRate(zoneRows, "enrolled"),
      freshman: sumDropoutRate(zoneRows, "freshman"),
    };
  });
}

function buildEstbDivBars(rows: DropoutRateRow[]): DropoutEstbDivBarPoint[] {
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
      enrolled: sumDropoutRate(matched, "enrolled"),
      freshman: sumDropoutRate(matched, "freshman"),
    };
  });
}

function buildSidoBars(rows: DropoutRateRow[]): DropoutRegionBarPoint[] {
  const points = SIDO_ORDER.map((region) => ({
    region,
    enrolled: sumDropoutRate(
      rows.filter((r) => r.region === region),
      "enrolled",
    ),
    freshman: sumDropoutRate(
      rows.filter((r) => r.region === region),
      "freshman",
    ),
  })).filter((p) => p.enrolled != null);

  return points.sort((a, b) => (b.enrolled ?? 0) - (a.enrolled ?? 0));
}

export function buildDropoutChartMetrics(
  rows: DropoutRateRow[],
  filters: DropoutChartFilters,
  options?: { years?: number[] },
): DropoutChartMetrics {
  const filtered = filterDropoutChartRows(rows, filters);
  const referenceYear = resolveReferenceYear(filtered, filters.year);
  const yearScoped =
    filters.year === "all"
      ? filtered
      : filtered.filter((r) => r.year === referenceYear);

  const enrolledRate = sumDropoutRate(yearScoped, "enrolled");
  const freshmanRate = sumDropoutRate(yearScoped, "freshman");

  const metroEnrolled = sumDropoutRate(
    yearScoped.filter((r) => METRO_REGIONS.has(r.region)),
    "enrolled",
  );
  const nonMetroEnrolled = sumDropoutRate(
    yearScoped.filter((r) => !METRO_REGIONS.has(r.region)),
    "enrolled",
  );
  const metroGap =
    metroEnrolled != null && nonMetroEnrolled != null
      ? Math.round((metroEnrolled - nonMetroEnrolled) * 100) / 100
      : null;

  const zoneRates: { name: string; rate: number }[] = [];
  for (const zone of ANALYTICS_ZONES) {
    const zoneRows = yearScoped.filter((r) => zoneForRegion(r.region) === zone);
    const rate = sumDropoutRate(zoneRows, "enrolled");
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
    enrolled: sumDropoutRate(
      filtered.filter((r) => r.year === year),
      "enrolled",
    ),
    freshman: sumDropoutRate(
      filtered.filter((r) => r.year === year),
      "freshman",
    ),
  }));

  const regionCategory =
    filters.regionCategory === "all" ? "zones" : filters.regionCategory;

  return {
    kpis: {
      enrolledRate,
      enrolledYoy: yoyDelta(filtered, referenceYear, "enrolled"),
      freshmanRate,
      freshmanYoy: yoyDelta(filtered, referenceYear, "freshman"),
      metroEnrolled,
      nonMetroEnrolled,
      metroGap,
      highestZone,
      lowestZone,
    },
    yearTrend,
    regionBars: buildRegionBars(yearScoped, regionCategory),
    estbDivBars: buildEstbDivBars(yearScoped),
    sidoBars: buildSidoBars(yearScoped),
    sidoBaseline: enrolledRate,
    referenceYear,
  };
}

export function fmtDropoutPct(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function fmtDropoutDelta(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value === 0) return "0.0%p";
  const arrow = value > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%p`;
}
