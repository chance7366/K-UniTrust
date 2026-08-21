import { readCsvFile } from "@/lib/csv/read";
import {
  ANALYSIS_TARGET_COHORT_DIVISION,
  type AnalysisTargetCohort,
  type AnalysisTargetDashboardData,
  type AnalysisTargetQuery,
  type AnalysisTargetRepRow,
  type AnalysisTargetViewMode,
} from "@/lib/analysis/analysis-target-view";
import type { AnalysisTargetRow } from "@/lib/ingest/analysis-target-config";

export type {
  AnalysisTargetCohort,
  AnalysisTargetDashboardData,
  AnalysisTargetQuery,
  AnalysisTargetRepRow,
  AnalysisTargetViewMode,
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function parseRow(r: Record<string, string>): AnalysisTargetRow | null {
  const year = num(r.year);
  const schoolCodeStd = r.school_code_std?.trim();
  const schoolName = r.school_name?.trim();
  if (!year || !schoolCodeStd || !schoolName) return null;

  return {
    year,
    schoolCodeStd,
    schoolName,
    mainBranchName: r.main_branch_name ?? "",
    schoolRepCode: r.school_rep_code ?? "",
    schoolRepName: r.school_rep_name ?? "",
    parentSchoolName: r.parent_school_name ?? "",
    schoolDivision: r.school_division ?? "",
    schoolKind: r.school_kind ?? "",
    region: r.region ?? "",
    estb: r.estb ?? "",
    relatedLaw: r.related_law ?? "",
    corpName: r.corp_name ?? "",
    status: r.status ?? "",
    studentAidRestrict: r.student_aid_restrict ?? "",
    provisionalBoard: r.provisional_board ?? "",
    noSettlement: r.no_settlement ?? "",
  };
}

function matchesFilter(value: string, filter: string): boolean {
  return !filter || value === filter;
}

function isFlag(value: string): boolean {
  return value.trim() === "해당";
}

function pickPrimaryCampus(rows: AnalysisTargetRow[]): AnalysisTargetRow {
  const main = rows.find((row) => row.mainBranchName === "본교");
  if (main) return main;
  const codeMatch = rows.find(
    (row) => row.schoolRepCode && row.schoolCodeStd === row.schoolRepCode,
  );
  if (codeMatch) return codeMatch;
  return [...rows].sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName, "ko"),
  )[0]!;
}

function rollupByRepCode(rows: AnalysisTargetRow[]): AnalysisTargetRepRow[] {
  const groups = new Map<string, AnalysisTargetRow[]>();
  for (const row of rows) {
    const key = row.schoolRepCode || row.schoolCodeStd;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  const out: AnalysisTargetRepRow[] = [];
  for (const group of groups.values()) {
    const primary = pickPrimaryCampus(group);
    out.push({
      ...primary,
      campusCount: group.length,
      studentAidRestrict: group.some((r) => isFlag(r.studentAidRestrict))
        ? "해당"
        : "",
      provisionalBoard: group.some((r) => isFlag(r.provisionalBoard))
        ? "해당"
        : "",
      noSettlement: group.some((r) => isFlag(r.noSettlement)) ? "해당" : "",
    });
  }

  return out.sort(
    (a, b) =>
      (a.schoolRepName || a.schoolName).localeCompare(
        b.schoolRepName || b.schoolName,
        "ko",
      ) || a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

function parseViewMode(value: string | undefined): AnalysisTargetViewMode {
  return value === "rep" ? "rep" : "campus";
}

function parseCohort(value: string | undefined): AnalysisTargetCohort {
  if (value === "junior-college" || value === "graduate") return value;
  return "university";
}

export async function loadAnalysisTargetDashboard(
  query: AnalysisTargetQuery = {},
): Promise<AnalysisTargetDashboardData> {
  const raw = await readCsvFile("univMapAnalysisTarget").catch(() => []);

  const yearSet = new Set<number>();
  let uploadedAt: string | null = null;

  for (const r of raw) {
    const year = num(r.year);
    if (year) yearSet.add(year);
    const at = r.uploaded_at?.trim();
    if (at && (!uploadedAt || at > uploadedAt)) {
      uploadedAt = at;
    }
  }

  const years = [...yearSet].sort((a, b) => a - b);
  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (years.at(-1) ?? null);

  const viewMode = parseViewMode(query.view);
  const estbFilter = query.estb?.trim() ?? "";
  const mainBranchFilter =
    viewMode === "campus" ? (query.mainBranch?.trim() ?? "") : "";
  const schoolDivisionFilter =
    viewMode === "campus" ? (query.schoolDivision?.trim() ?? "") : "";
  const schoolKindFilter = query.schoolKind?.trim() ?? "";
  const regionFilter = query.region?.trim() ?? "";
  const statusFilter = query.status?.trim() ?? "";
  const q = query.q?.trim().toLowerCase() ?? "";

  const estbSet = new Set<string>();
  const mainBranchSet = new Set<string>();
  const schoolDivisionSet = new Set<string>();
  const schoolKindSet = new Set<string>();
  const regionSet = new Set<string>();
  const statusSet = new Set<string>();
  const yearRows: AnalysisTargetRow[] = [];

  if (displayYear != null) {
    for (const r of raw) {
      const year = num(r.year);
      const schoolName = r.school_name?.trim();
      if (!year || !schoolName || year !== displayYear) continue;

      const parsed = parseRow(r);
      if (!parsed) continue;

      yearRows.push(parsed);
      if (parsed.estb) estbSet.add(parsed.estb);
      if (parsed.mainBranchName) mainBranchSet.add(parsed.mainBranchName);
      if (parsed.schoolDivision) schoolDivisionSet.add(parsed.schoolDivision);
      if (parsed.schoolKind) schoolKindSet.add(parsed.schoolKind);
      if (parsed.region) regionSet.add(parsed.region);
      if (parsed.status) statusSet.add(parsed.status);
    }
  }

  const yearRowCount = yearRows.length;

  function matchesSharedFilters(row: AnalysisTargetRow): boolean {
    if (!matchesFilter(row.estb, estbFilter)) return false;
    if (!matchesFilter(row.schoolKind, schoolKindFilter)) return false;
    if (!matchesFilter(row.region, regionFilter)) return false;
    if (!matchesFilter(row.status, statusFilter)) return false;
    if (q) {
      const haystack = [
        row.schoolName,
        row.schoolCodeStd,
        row.schoolRepCode,
        row.schoolRepName,
        row.parentSchoolName,
        row.corpName,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  const sharedFiltered = yearRows.filter(matchesSharedFilters);

  const rows: AnalysisTargetRow[] = [];
  if (viewMode === "campus") {
    for (const row of sharedFiltered) {
      if (!matchesFilter(row.mainBranchName, mainBranchFilter)) continue;
      if (!matchesFilter(row.schoolDivision, schoolDivisionFilter)) continue;
      rows.push(row);
    }
    rows.sort(
      (a, b) =>
        a.schoolName.localeCompare(b.schoolName, "ko") ||
        a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko"),
    );
  }

  const univRep = rollupByRepCode(
    sharedFiltered.filter(
      (row) => row.schoolDivision === ANALYSIS_TARGET_COHORT_DIVISION.university,
    ),
  );
  const jcRep = rollupByRepCode(
    sharedFiltered.filter(
      (row) =>
        row.schoolDivision === ANALYSIS_TARGET_COHORT_DIVISION["junior-college"],
    ),
  );
  const gradRep = rollupByRepCode(
    sharedFiltered.filter(
      (row) => row.schoolDivision === ANALYSIS_TARGET_COHORT_DIVISION.graduate,
    ),
  );

  const cohortCounts: Record<AnalysisTargetCohort, number> = {
    university: univRep.length,
    "junior-college": jcRep.length,
    graduate: gradRep.length,
  };

  let cohort = parseCohort(query.cohort);
  if (cohort === "graduate" && cohortCounts.graduate === 0) {
    cohort = "university";
  }

  const repRows =
    viewMode === "rep"
      ? cohort === "junior-college"
        ? jcRep
        : cohort === "graduate"
          ? gradRep
          : univRep
      : [];

  const schoolKindOptions =
    viewMode === "rep"
      ? sortKo([
          ...new Set(
            yearRows
              .filter(
                (row) =>
                  row.schoolDivision === ANALYSIS_TARGET_COHORT_DIVISION[cohort],
              )
              .map((row) => row.schoolKind)
              .filter(Boolean),
          ),
        ])
      : sortKo([...schoolKindSet]);

  return {
    years,
    displayYear,
    viewMode,
    cohort,
    rows,
    repRows,
    cohortCounts,
    filterOptions: {
      estbs: sortKo([...estbSet]),
      mainBranches: sortKo([...mainBranchSet]),
      schoolDivisions: sortKo([...schoolDivisionSet]),
      schoolKinds: schoolKindOptions,
      regions: sortKo([...regionSet]),
      statuses: sortKo([...statusSet]),
    },
    yearRowCount,
    filters: {
      estb: estbFilter,
      mainBranch: mainBranchFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKind: schoolKindFilter,
      region: regionFilter,
      status: statusFilter,
      q,
    },
    hasData: years.length > 0,
    uploadedAt,
    rowCount: raw.length,
  };
}

export function parseAnalysisTargetQuery(searchParams: {
  year?: string;
  view?: string;
  cohort?: string;
  schoolKind?: string;
  schoolDivision?: string;
  estb?: string;
  mainBranch?: string;
  region?: string;
  status?: string;
  q?: string;
}): AnalysisTargetQuery {
  const year = Number(searchParams.year);
  return {
    year: Number.isFinite(year) ? year : null,
    view: parseViewMode(searchParams.view),
    cohort: parseCohort(searchParams.cohort),
    estb: searchParams.estb,
    mainBranch: searchParams.mainBranch,
    schoolDivision: searchParams.schoolDivision,
    schoolKind: searchParams.schoolKind,
    region: searchParams.region,
    status: searchParams.status,
    q: searchParams.q,
  };
}
