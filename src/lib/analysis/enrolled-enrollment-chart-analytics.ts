import { ANALYTICS_ZONES, zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import type { EnrolledEnrollmentRow } from "@/lib/ingest/enrolled-enrollment-config";
import {
  normalizeEstbGroup,
  resolveSchoolDivisionFromFields,
  resolveSchoolKindDivision,
} from "@/lib/analysis/school-division";

export type EnrolledChartDbType = "campus" | "consolidated";

export type EnrolledChartYearFilter = "all" | string;

export type EnrolledChartHalfFilter = "all" | "상반기" | "하반기";

export type EnrolledChartEstbFilter = "all" | "국공립" | "사립";

export type EnrolledChartSchoolDivFilter = "all" | "대학" | "전문대학";

export type EnrolledChartRegionCategory =
  | "all"
  | "metro"
  | "zones"
  | "sido";

export type EnrolledChartFilters = {
  year: EnrolledChartYearFilter;
  half: EnrolledChartHalfFilter;
  estb: EnrolledChartEstbFilter;
  schoolDivision: EnrolledChartSchoolDivFilter;
  schoolKinds: string[];
  regions: string[];
  regionCategory: EnrolledChartRegionCategory;
};

export type EnrolledChartKpis = {
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

export type EnrolledYearTrendPoint = {
  year: string;
  within: number | null;
  total: number | null;
};

export type EnrolledRegionBarPoint = {
  region: string;
  within: number | null;
  total: number | null;
};

export type EnrolledEstbDivBarPoint = {
  group: string;
  within: number | null;
  total: number | null;
};

export type EnrolledChartMetrics = {
  kpis: EnrolledChartKpis;
  yearTrend: EnrolledYearTrendPoint[];
  regionBars: EnrolledRegionBarPoint[];
  estbDivBars: EnrolledEstbDivBarPoint[];
  sidoBars: EnrolledRegionBarPoint[];
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

function effectiveQuota(row: EnrolledEnrollmentRow): number {
  return Math.max(0, row.studentQuota - row.recruitmentSuspension);
}

/** Σ재학생 ÷ Σ(학생정원−모집정지) × 100 */
function sumFillRate(
  rows: EnrolledEnrollmentRow[],
  mode: "within" | "total",
): number | null {
  if (!rows.length) return null;
  let enrolled = 0;
  let quota = 0;
  for (const row of rows) {
    const denom = effectiveQuota(row);
    if (!denom) continue;
    enrolled +=
      mode === "within" ? Number(row.enrolled.within) || 0 : Number(row.enrolled.total) || 0;
    quota += denom;
  }
  if (!quota) return null;
  return Math.round((enrolled / quota) * 10000) / 100;
}

function zoneForRegion(region: string) {
  return zoneForSido(region);
}

function filterEligibleRows(rows: EnrolledEnrollmentRow[]): EnrolledEnrollmentRow[] {
  return rows.filter((row) => {
    if (!normalizeEstbGroup(row.estb)) return false;
    return (
      resolveSchoolDivisionFromFields(row.schoolKind ?? "", row.schoolDivision ?? "") !=
      null
    );
  });
}

export function getEnrolledChartSchoolKindOptions(
  rows: EnrolledEnrollmentRow[],
  estb: EnrolledChartEstbFilter,
  schoolDivision: EnrolledChartSchoolDivFilter,
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

export function filterEnrolledChartRows(
  rows: EnrolledEnrollmentRow[],
  filters: EnrolledChartFilters,
): EnrolledEnrollmentRow[] {
  return filterEligibleRows(rows).filter((row) => {
    if (filters.year !== "all" && row.year !== Number(filters.year)) return false;
    if (filters.half !== "all" && row.half !== filters.half) return false;

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
  rows: EnrolledEnrollmentRow[],
  yearFilter: EnrolledChartYearFilter,
): number {
  if (yearFilter !== "all") return Number(yearFilter);
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
  return years[0] ?? new Date().getFullYear();
}

function yoyDelta(
  rows: EnrolledEnrollmentRow[],
  year: number,
  half: EnrolledChartHalfFilter,
  mode: "within" | "total",
): number | null {
  const scope = (y: number) =>
    rows.filter(
      (r) =>
        r.year === y && (half === "all" || r.half === half),
    );
  const current = sumFillRate(scope(year), mode);
  const prev = sumFillRate(scope(year - 1), mode);
  if (current == null || prev == null) return null;
  return Math.round((current - prev) * 100) / 100;
}

function buildRegionBars(
  rows: EnrolledEnrollmentRow[],
  regionCategory: EnrolledChartRegionCategory,
): EnrolledRegionBarPoint[] {
  if (regionCategory === "metro") {
    return [
      {
        region: "수도권",
        within: sumFillRate(
          rows.filter((r) => METRO_REGIONS.has(r.region)),
          "within",
        ),
        total: sumFillRate(
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
        total: sumFillRate(
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
      total: sumFillRate(
        rows.filter((r) => r.region === region),
        "total",
      ),
    })).filter((p) => p.within != null || p.total != null);
  }

  return ANALYTICS_ZONES.map((zone) => {
    const zoneRows = rows.filter((r) => zoneForRegion(r.region) === zone);
    return {
      region: zone,
      within: sumFillRate(zoneRows, "within"),
      total: sumFillRate(zoneRows, "total"),
    };
  });
}

function buildEstbDivBars(rows: EnrolledEnrollmentRow[]): EnrolledEstbDivBarPoint[] {
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
      total: sumFillRate(matched, "total"),
    };
  });
}

function buildSidoBars(rows: EnrolledEnrollmentRow[]): EnrolledRegionBarPoint[] {
  const points = SIDO_ORDER.map((region) => ({
    region,
    within: sumFillRate(
      rows.filter((r) => r.region === region),
      "within",
    ),
    total: sumFillRate(
      rows.filter((r) => r.region === region),
      "total",
    ),
  })).filter((p) => p.within != null);

  return points.sort((a, b) => (b.within ?? 0) - (a.within ?? 0));
}

export function buildEnrolledChartMetrics(
  rows: EnrolledEnrollmentRow[],
  filters: EnrolledChartFilters,
  options?: { years?: number[] },
): EnrolledChartMetrics {
  const filtered = filterEnrolledChartRows(rows, filters);
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
      filtered.filter(
        (r) =>
          r.year === year &&
          (filters.half === "all" || r.half === filters.half),
      ),
      "within",
    ),
    total: sumFillRate(
      filtered.filter(
        (r) =>
          r.year === year &&
          (filters.half === "all" || r.half === filters.half),
      ),
      "total",
    ),
  }));

  const regionCategory =
    filters.regionCategory === "all" ? "zones" : filters.regionCategory;

  return {
    kpis: {
      withinRate,
      withinYoy: yoyDelta(filtered, referenceYear, filters.half, "within"),
      totalRate,
      totalYoy: yoyDelta(filtered, referenceYear, filters.half, "total"),
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

export function fmtEnrolledPct(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function fmtEnrolledDelta(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value === 0) return "0.0%p";
  const arrow = value > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%p`;
}
