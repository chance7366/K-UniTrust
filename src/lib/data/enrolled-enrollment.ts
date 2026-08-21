import { readCsvFile } from "@/lib/csv/read";
import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import {
  parseMultiFilterParam,
  rowMatchesTableFilters,
} from "@/lib/analysis/table-filter-utils";
import {
  enrichRowsWithSchoolDivision,
  loadSchoolDivisionLookup,
} from "@/lib/ingest/school-code-lookup";
import type { EnrolledEnrollmentRow } from "@/lib/ingest/enrolled-enrollment-config";
import type { EnrolledEnrollmentConsolidatedRow } from "@/lib/ingest/enrolled-enrollment-consolidated-config";
import { enrolledPeriodKey, ENROLLED_HALF_PERIODS } from "@/lib/ingest/enrolled-enrollment-period";

export type EnrolledEnrollmentViewMode = "campus" | "consolidated";

export type EnrolledEnrollmentSection = "charts" | "data";

export type EnrolledEnrollmentQuery = {
  year?: number | null;
  half?: string;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
  view?: EnrolledEnrollmentViewMode;
  section?: EnrolledEnrollmentSection;
};

export type EnrolledEnrollmentFilterOptions = {
  halves: string[];
  estbs: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
  regions: string[];
};

export type EnrolledEnrollmentPeriodStatus = {
  period: string;
  year: number;
  half: string;
  hasCampusData: boolean;
  hasConsolidatedData: boolean;
  campusRowCount: number;
  consolidatedRowCount: number;
  consolidatedAt: string | null;
};

export type EnrolledEnrollmentYearStatus = {
  year: number;
  hasCampusData: boolean;
  hasConsolidatedData: boolean;
  allPeriodsConsolidated: boolean;
  campusRowCount: number;
  consolidatedRowCount: number;
  periods: EnrolledEnrollmentPeriodStatus[];
};

export type EnrolledEnrollmentDashboardData = {
  years: number[];
  displayYear: number | null;
  rows: EnrolledEnrollmentRow[];
  consolidatedRows: EnrolledEnrollmentConsolidatedRow[];
  allCampusRows: EnrolledEnrollmentRow[];
  allConsolidatedRows: EnrolledEnrollmentConsolidatedRow[];
  periodStatuses: EnrolledEnrollmentPeriodStatus[];
  yearStatuses: EnrolledEnrollmentYearStatus[];
  viewMode: EnrolledEnrollmentViewMode;
  section: EnrolledEnrollmentSection;
  hasAnyConsolidatedData: boolean;
  filterOptions: EnrolledEnrollmentFilterOptions;
  yearRowCount: number;
  filters: {
    half: string;
    estb: string;
    schoolDivision: string;
    schoolKinds: string[];
    regions: string[];
    search: string;
  };
  hasData: boolean;
  uploadedAt: string | null;
  rowCount: number;
  consolidatedRowCount: number;
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function halfSort(a: string, b: string): number {
  const order = (h: string) => (h === "상반기" ? 0 : h === "하반기" ? 1 : 2);
  return order(a) - order(b) || a.localeCompare(b, "ko");
}

function parseCampusRow(r: Record<string, string>): EnrolledEnrollmentRow | null {
  const year = num(r.year);
  const half = r.half?.trim();
  const schoolName = r.school_name?.trim();
  if (!year || !half || !schoolName) return null;

  return {
    year,
    half,
    schoolKind: r.school_kind ?? "",
    estb: r.estb ?? "",
    schoolDivision: r.school_division ?? "",
    region: r.region ?? "",
    schoolCodeStd: r.school_code_std ?? "",
    schoolName,
    studentQuota: num(r.student_quota) ?? 0,
    recruitmentSuspension: num(r.recruitment_suspension) ?? 0,
    enrolled: {
      total: num(r.enrolled_total) ?? 0,
      within: num(r.enrolled_within) ?? 0,
      outside: num(r.enrolled_outside) ?? 0,
    },
    fillRate: num(r.fill_rate) ?? 0,
    fillRateWithin: num(r.fill_rate_within) ?? 0,
  };
}

function parseConsolidatedRow(
  r: Record<string, string>,
): EnrolledEnrollmentConsolidatedRow | null {
  const year = num(r.year);
  const half = r.half?.trim();
  const schoolName = r.school_rep_name?.trim();
  const repCode = r.school_rep_code?.trim();
  if (!year || !half || !schoolName || !repCode) return null;

  return {
    year,
    half,
    schoolKind: r.school_kind ?? "",
    estb: r.estb ?? "",
    schoolDivision: r.school_division ?? "",
    region: r.region ?? "",
    schoolCodeStd: repCode,
    schoolName,
    studentQuota: num(r.student_quota) ?? 0,
    recruitmentSuspension: num(r.recruitment_suspension) ?? 0,
    enrolled: {
      total: num(r.enrolled_total) ?? 0,
      within: num(r.enrolled_within) ?? 0,
      outside: num(r.enrolled_outside) ?? 0,
    },
    fillRate: num(r.fill_rate) ?? 0,
    fillRateWithin: num(r.fill_rate_within) ?? 0,
    campusCount: num(r.campus_count) ?? 1,
  };
}

type RawFilterRow = {
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  region: string;
};

function matchesHalfFilter(half: string, filter: string): boolean {
  return !filter || half === filter;
}

function compareEnrollmentRows<
  T extends {
    region: string;
    schoolName: string;
    schoolCodeStd: string;
    half: string;
  },
>(a: T, b: T, groupHalvesBySchool: boolean): number {
  if (groupHalvesBySchool) {
    return (
      a.schoolName.localeCompare(b.schoolName, "ko") ||
      a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko") ||
      halfSort(a.half, b.half)
    );
  }

  return (
    a.schoolName.localeCompare(b.schoolName, "ko") ||
    a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko") ||
    halfSort(a.half, b.half)
  );
}

function buildPeriodStatuses(
  campusRaw: Record<string, string>[],
  consolidatedRaw: Record<string, string>[],
): EnrolledEnrollmentPeriodStatus[] {
  const campusByPeriod = new Map<string, number>();
  const consolidatedByPeriod = new Map<
    string,
    { count: number; at: string | null }
  >();

  for (const r of campusRaw) {
    const year = num(r.year);
    const half = r.half?.trim();
    if (!year || !half) continue;
    const key = enrolledPeriodKey(year, half);
    campusByPeriod.set(key, (campusByPeriod.get(key) ?? 0) + 1);
  }

  for (const r of consolidatedRaw) {
    const year = num(r.year);
    const half = r.half?.trim();
    if (!year || !half) continue;
    const key = enrolledPeriodKey(year, half);
    const prev = consolidatedByPeriod.get(key) ?? { count: 0, at: null };
    const at = r.consolidated_at?.trim() ?? null;
    consolidatedByPeriod.set(key, {
      count: prev.count + 1,
      at: at && (!prev.at || at > prev.at) ? at : prev.at,
    });
  }

  const periods = [
    ...new Set([...campusByPeriod.keys(), ...consolidatedByPeriod.keys()]),
  ].sort();

  return periods.map((period) => {
    const [yearStr, half] = period.split(":");
    const year = Number(yearStr);
    const campusRowCount = campusByPeriod.get(period) ?? 0;
    const consolidated = consolidatedByPeriod.get(period);
    return {
      period,
      year,
      half: half ?? "",
      hasCampusData: campusRowCount > 0,
      hasConsolidatedData: (consolidated?.count ?? 0) > 0,
      campusRowCount,
      consolidatedRowCount: consolidated?.count ?? 0,
      consolidatedAt: consolidated?.at ?? null,
    };
  });
}

function buildYearStatuses(
  periodStatuses: EnrolledEnrollmentPeriodStatus[],
): EnrolledEnrollmentYearStatus[] {
  const byYear = new Map<number, EnrolledEnrollmentPeriodStatus[]>();
  for (const p of periodStatuses) {
    const list = byYear.get(p.year) ?? [];
    list.push(p);
    byYear.set(p.year, list);
  }

  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, periods]) => {
      const campusRowCount = periods.reduce((s, p) => s + p.campusRowCount, 0);
      const consolidatedRowCount = periods.reduce(
        (s, p) => s + p.consolidatedRowCount,
        0,
      );
      const campusPeriods = periods.filter((p) => p.hasCampusData);
      const allPeriodsConsolidated =
        campusPeriods.length > 0 &&
        campusPeriods.every((p) => p.hasConsolidatedData);

      return {
        year,
        hasCampusData: campusRowCount > 0,
        hasConsolidatedData: consolidatedRowCount > 0,
        allPeriodsConsolidated,
        campusRowCount,
        consolidatedRowCount,
        periods,
      };
    });
}

export async function loadEnrolledEnrollmentDashboard(
  query: EnrolledEnrollmentQuery = {},
): Promise<EnrolledEnrollmentDashboardData> {
  const [campusRaw, consolidatedRaw, divisionLookup] = await Promise.all([
    readCsvFile("financeAnalysisEnrolledEnrollment").catch(() => []),
    readCsvFile("financeAnalysisEnrolledEnrollmentConsolidated").catch(
      () => [],
    ),
    loadSchoolDivisionLookup(),
  ]);

  const campusEnriched = enrichRowsWithSchoolDivision(
    campusRaw,
    divisionLookup,
  );
  const consolidatedEnriched = enrichRowsWithSchoolDivision(
    consolidatedRaw,
    divisionLookup,
  );

  const periodStatuses = buildPeriodStatuses(campusEnriched, consolidatedEnriched);
  const yearStatuses = buildYearStatuses(periodStatuses);

  let uploadedAt: string | null = null;
  for (const r of campusRaw) {
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) {
      uploadedAt = at;
    }
  }

  const years = yearStatuses
    .filter((s) => s.hasCampusData)
    .map((s) => s.year);

  const viewMode: EnrolledEnrollmentViewMode =
    query.view === "consolidated" ? "consolidated" : "campus";

  const section: EnrolledEnrollmentSection =
    query.section === "charts" ? "charts" : "data";

  const allCampusRows: EnrolledEnrollmentRow[] = [];
  const allConsolidatedRows: EnrolledEnrollmentConsolidatedRow[] = [];
  if (section === "charts") {
    for (const r of campusEnriched) {
      const parsed = parseCampusRow(r);
      if (parsed) allCampusRows.push(parsed);
    }
    allCampusRows.sort(
      (a, b) =>
        a.year - b.year ||
        halfSort(a.half, b.half) ||
        a.schoolName.localeCompare(b.schoolName, "ko"),
    );

    for (const r of consolidatedEnriched) {
      const parsed = parseConsolidatedRow(r);
      if (parsed) allConsolidatedRows.push(parsed);
    }
    allConsolidatedRows.sort(
      (a, b) =>
        a.year - b.year ||
        halfSort(a.half, b.half) ||
        a.schoolName.localeCompare(b.schoolName, "ko"),
    );
  }

  const hasAnyConsolidatedData = consolidatedEnriched.length > 0;

  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (years.at(-1) ?? null);

  const estbFilter = query.estb?.trim() ?? "";
  const schoolDivisionFilter = query.schoolDivision?.trim() ?? "";
  const schoolKindsFilter = parseMultiFilterParam(query.schoolKind);
  const regionsFilter = parseMultiFilterParam(query.region);
  const halfFilter =
    query.half && ENROLLED_HALF_PERIODS.includes(query.half as (typeof ENROLLED_HALF_PERIODS)[number])
      ? query.half
      : "";
  const searchFilter = query.search?.trim() ?? "";

  const estbSet = new Set<string>();
  const schoolDivisionSet = new Set<string>();
  const regionSet = new Set<string>();
  const optionRows: RawFilterRow[] = [];
  let yearRowCount = 0;
  const rows: EnrolledEnrollmentRow[] = [];
  const consolidatedRows: EnrolledEnrollmentConsolidatedRow[] = [];

  if (displayYear != null) {
    const sourceForFilters =
      viewMode === "consolidated" ? consolidatedEnriched : campusEnriched;

    for (const r of sourceForFilters) {
      const year = num(r.year);
      const half = r.half?.trim() ?? "";
      if (!year || !half || year !== displayYear) continue;
      if (!matchesHalfFilter(half, halfFilter)) continue;

      if (viewMode === "consolidated") {
        if (!r.school_rep_name?.trim()) continue;
      } else if (!r.school_name?.trim()) {
        continue;
      }

      yearRowCount += 1;
      const schoolKind = r.school_kind ?? "";
      const estb = r.estb ?? "";
      const schoolDivision = r.school_division ?? "";
      const region = r.region ?? "";
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

    for (const r of campusEnriched) {
      const year = num(r.year);
      const half = r.half?.trim() ?? "";
      const schoolName = r.school_name?.trim();
      if (!year || !half || !schoolName) continue;
      if (year !== displayYear) continue;
      if (!matchesHalfFilter(half, halfFilter)) continue;

      if (
        !rowMatchesTableFilters(
          {
            estb: r.estb ?? "",
            schoolKind: r.school_kind ?? "",
            schoolDivision: r.school_division ?? "",
            region: r.region ?? "",
            schoolName,
          },
          tableFilters,
        )
      ) {
        continue;
      }

      const parsed = parseCampusRow(r);
      if (parsed) rows.push(parsed);
    }

    for (const r of consolidatedEnriched) {
      const year = num(r.year);
      const half = r.half?.trim() ?? "";
      if (!year || !half) continue;
      if (year !== displayYear) continue;
      if (!matchesHalfFilter(half, halfFilter)) continue;

      if (
        !rowMatchesTableFilters(
          {
            estb: r.estb ?? "",
            schoolKind: r.school_kind ?? "",
            schoolDivision: r.school_division ?? "",
            region: r.region ?? "",
            schoolName: r.school_rep_name?.trim() ?? "",
          },
          tableFilters,
        )
      ) {
        continue;
      }

      const parsed = parseConsolidatedRow(r);
      if (parsed) consolidatedRows.push(parsed);
    }
  }

  const schoolKindSet = getTableSchoolKindOptions(
    optionRows,
    estbFilter,
    schoolDivisionFilter,
  );

  const groupHalvesBySchool = !halfFilter;

  rows.sort((a, b) => compareEnrollmentRows(a, b, groupHalvesBySchool));

  consolidatedRows.sort((a, b) =>
    compareEnrollmentRows(a, b, groupHalvesBySchool),
  );

  return {
    years,
    displayYear,
    rows,
    consolidatedRows,
    allCampusRows,
    allConsolidatedRows,
    periodStatuses,
    yearStatuses,
    viewMode,
    section,
    hasAnyConsolidatedData,
    filterOptions: {
      halves: [...ENROLLED_HALF_PERIODS],
      estbs: sortKo([...estbSet]),
      schoolDivisions: sortKo([...schoolDivisionSet]),
      schoolKinds: schoolKindSet,
      regions: sortKo([...regionSet]),
    },
    yearRowCount,
    filters: {
      half: halfFilter,
      estb: estbFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKinds: schoolKindsFilter,
      regions: regionsFilter,
      search: searchFilter,
    },
    hasData: years.length > 0,
    uploadedAt,
    rowCount: campusEnriched.length,
    consolidatedRowCount: consolidatedEnriched.length,
  };
}

export function parseEnrolledEnrollmentQuery(searchParams: {
  year?: string;
  half?: string;
  estb?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  search?: string;
  view?: string;
  section?: string;
}): EnrolledEnrollmentQuery {
  const year = Number(searchParams.year);
  const view =
    searchParams.view === "consolidated" ? "consolidated" : "campus";
  const section =
    searchParams.section === "charts" ? "charts" : "data";
  return {
    year: Number.isFinite(year) ? year : null,
    half: searchParams.half,
    estb: searchParams.estb,
    schoolDivision: searchParams.schoolDivision,
    schoolKind: searchParams.schoolKind,
    region: searchParams.region,
    search: searchParams.search,
    view,
    section,
  };
}
