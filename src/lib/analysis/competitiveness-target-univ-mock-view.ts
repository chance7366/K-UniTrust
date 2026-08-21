export type CompetitivenessTargetCohort = "university" | "junior-college";

export type CompetitivenessSettingsTab =
  | "target"
  | "indicators"
  | "guidelines"
  | "absolute";

export const COMPETITIVENESS_TARGET_COHORT_LABEL: Record<
  CompetitivenessTargetCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

export const COMPETITIVENESS_TARGET_COHORT_DIVISION: Record<
  CompetitivenessTargetCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

export type CompetitivenessTargetUnivRow = {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  campusCount: number;
  enrolledTotal: number | null;
  studentAidRestrict: string;
  provisionalBoard: string;
  noSettlement: string;
  fundShortage: string;
};

export type CompetitivenessTargetUnivQuery = {
  tab?: CompetitivenessSettingsTab;
  year?: number | null;
  cohort?: CompetitivenessTargetCohort;
  region?: string;
  q?: string;
};

export type CompetitivenessTargetUnivData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  schoolCodeYear: number | null;
  fundSecureYear: number | null;
  enrolledYear: number | null;
  tab: CompetitivenessSettingsTab;
  cohort: CompetitivenessTargetCohort;
  cohortCounts: Record<CompetitivenessTargetCohort, number>;
  rows: CompetitivenessTargetUnivRow[];
  allCohortRows: Record<
    CompetitivenessTargetCohort,
    CompetitivenessTargetUnivRow[]
  >;
  filterOptions: { regions: string[] };
  filters: { region: string; q: string };
  flagCounts: {
    studentAidRestrict: number;
    provisionalBoard: number;
    noSettlement: number;
    fundShortage: number;
  };
  hasData: boolean;
};

function parseCohort(value: string | undefined): CompetitivenessTargetCohort {
  return value === "junior-college" ? "junior-college" : "university";
}

function parseTab(value: string | undefined): CompetitivenessSettingsTab {
  if (
    value === "indicators" ||
    value === "guidelines" ||
    value === "absolute"
  ) {
    return value;
  }
  return "target";
}

export function parseCompetitivenessTargetUnivQuery(
  searchParams: Record<string, string | undefined>,
): CompetitivenessTargetUnivQuery {
  const year = Number(searchParams.year);
  return {
    tab: parseTab(searchParams.tab ?? searchParams.section),
    year: Number.isFinite(year) ? year : null,
    cohort: parseCohort(searchParams.cohort),
    region: searchParams.region,
    q: searchParams.q,
  };
}

function searchParamsOf(
  query: CompetitivenessTargetUnivQuery & { resetFilters?: boolean },
  sectionKey: "tab" | "section" = "tab",
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "target") params.set(sectionKey, query.tab);
  if (query.year != null) params.set("year", String(query.year));
  if (query.cohort && query.cohort !== "university") {
    params.set("cohort", query.cohort);
  }
  if (!query.resetFilters) {
    if (query.region) params.set("region", query.region);
    if (query.q) params.set("q", query.q);
  }
  return params;
}

export function buildCompetitivenessTargetUnivMockHref(
  query: CompetitivenessTargetUnivQuery & { resetFilters?: boolean },
): string {
  const qs = searchParamsOf(query, "tab").toString();
  return `/mockups/competitiveness-analysis/settings${qs ? `?${qs}` : ""}`;
}

export function buildCompetitivenessTargetUnivHref(
  query: CompetitivenessTargetUnivQuery & { resetFilters?: boolean },
): string {
  const qs = searchParamsOf(query, "section").toString();
  return `/analysis/competitiveness-analysis/settings${qs ? `?${qs}` : ""}`;
}

export function toTargetUniversityRow(
  row: CompetitivenessTargetUnivRow,
): {
  schoolCodeStd: string;
  schoolName: string;
  estb: string;
    schoolDivision: string;
    schoolKind: string;
    region: string;
    enrolledTotal: number | null;
    studentAidRestrict: "" | "해당";
    noSettlement: "" | "해당";
    crisis: "" | "해당";
    noAccreditation: "" | "해당";
  provisionalBoard: "" | "해당";
  fundShortage: "" | "해당";
} {
  const studentAidRestrict = row.studentAidRestrict === "해당" ? "해당" : "";
  const noSettlement = row.noSettlement === "해당" ? "해당" : "";
  return {
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    estb: row.estb,
    schoolDivision: row.schoolDivision,
    schoolKind: row.schoolKind,
    region: row.region,
    enrolledTotal: row.enrolledTotal,
    studentAidRestrict,
    noSettlement,
    crisis: studentAidRestrict,
    noAccreditation: noSettlement,
    provisionalBoard: row.provisionalBoard === "해당" ? "해당" : "",
    fundShortage: row.fundShortage === "해당" ? "해당" : "",
  };
}
