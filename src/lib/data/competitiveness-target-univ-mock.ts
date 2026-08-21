import {
  COMPETITIVENESS_TARGET_COHORT_DIVISION,
  type CompetitivenessTargetCohort,
  type CompetitivenessTargetUnivData,
  type CompetitivenessTargetUnivQuery,
  type CompetitivenessTargetUnivRow,
} from "@/lib/analysis/competitiveness-target-univ-mock-view";
import {
  normalizeSchoolCodeText,
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import {
  buildEnrolledStudentCountsByRep,
  parseAlimiEnrolledStudentsGrad,
  parseAlimiEnrolledStudentsUndergrad,
} from "@/lib/analysis/enrolled-students-rep-count";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildCompetitivenessTargetUnivMockHref,
  parseCompetitivenessTargetUnivQuery,
  type CompetitivenessTargetUnivData,
  type CompetitivenessTargetUnivQuery,
} from "@/lib/analysis/competitiveness-target-univ-mock-view";

type TargetCampus = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolRepCode: string;
  schoolRepName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  mainBranchName: string;
  studentAidRestrict: string;
  provisionalBoard: string;
  noSettlement: string;
};

type SchoolCodeInfo = {
  schoolCodeStd: string;
  schoolRepCode: string;
  schoolDivision: string;
  schoolKind: string;
  mainBranchName: string;
};

function isFlag(value: string): boolean {
  return value.trim() === "해당";
}

function parseTargetCampus(
  raw: Record<string, string>,
): TargetCampus | null {
  const year = parseYearText(raw.year ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  const schoolName = raw.school_name?.trim() ?? "";
  if (!year || !schoolCodeStd || !schoolName) return null;
  return {
    year,
    schoolCodeStd,
    schoolName,
    schoolRepCode:
      normalizeSchoolCodeText(raw.school_rep_code ?? "") || schoolCodeStd,
    schoolRepName: raw.school_rep_name?.trim() || schoolName,
    schoolDivision: raw.school_division?.trim() ?? "",
    schoolKind: raw.school_kind?.trim() ?? "",
    region: raw.region?.trim() ?? "",
    estb: raw.estb?.trim() ?? "",
    mainBranchName: raw.main_branch_name?.trim() ?? "",
    studentAidRestrict: raw.student_aid_restrict?.trim() ?? "",
    provisionalBoard: raw.provisional_board?.trim() ?? "",
    noSettlement: raw.no_settlement?.trim() ?? "",
  };
}

function parseSchoolCodeInfo(
  raw: Record<string, string>,
): (SchoolCodeInfo & { year: number }) | null {
  const year = parseYearText(raw.year ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  return {
    year,
    schoolCodeStd,
    schoolRepCode: normalizeSchoolCodeText(raw.school_rep_code ?? ""),
    schoolDivision: raw.school_division?.trim() ?? "",
    schoolKind: raw.school_kind?.trim() ?? "",
    mainBranchName: raw.main_branch_name?.trim() ?? "",
  };
}

function pickPrimaryCampus(rows: TargetCampus[]): TargetCampus {
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

function pickSchoolCodeInfo(
  byCode: Map<string, SchoolCodeInfo>,
  byRep: Map<string, SchoolCodeInfo[]>,
  campus: TargetCampus,
): SchoolCodeInfo | undefined {
  const direct = byCode.get(campus.schoolCodeStd);
  if (direct) return direct;
  const group = byRep.get(campus.schoolRepCode) ?? [];
  const main = group.find((row) => row.mainBranchName === "본교");
  if (main) return main;
  const codeMatch = group.find(
    (row) => row.schoolRepCode && row.schoolCodeStd === row.schoolRepCode,
  );
  return codeMatch ?? group[0];
}

function groupByRep(
  campuses: TargetCampus[],
  division: string,
): Map<string, TargetCampus[]> {
  const groups = new Map<string, TargetCampus[]>();
  for (const row of campuses) {
    if (row.schoolDivision !== division) continue;
    const key = row.schoolRepCode || row.schoolCodeStd;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function parseNoSettlementCodes(
  campuses: TargetCampus[],
  year: number,
): Set<string> {
  const codes = new Set<string>();
  for (const row of campuses) {
    if (row.year !== year || !isFlag(row.noSettlement)) continue;
    const code = row.schoolRepCode || row.schoolCodeStd;
    if (code) codes.add(code);
  }
  return codes;
}

function buildRows(args: {
  displayYear: number;
  campuses: TargetCampus[];
  cohort: CompetitivenessTargetCohort;
  schoolCodeByStd: Map<string, SchoolCodeInfo>;
  schoolCodeByRep: Map<string, SchoolCodeInfo[]>;
  shortageCodes: Set<string>;
  noSettlementCodes: Set<string>;
  enrolledByRep: Map<string, number>;
}): CompetitivenessTargetUnivRow[] {
  const groups = groupByRep(
    args.campuses,
    COMPETITIVENESS_TARGET_COHORT_DIVISION[args.cohort],
  );
  const rows: CompetitivenessTargetUnivRow[] = [];

  for (const [repCode, campuses] of groups) {
    const primary = pickPrimaryCampus(campuses);
    const codeInfo = pickSchoolCodeInfo(
      args.schoolCodeByStd,
      args.schoolCodeByRep,
      primary,
    );
    rows.push({
      year: args.displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      schoolDivision:
        codeInfo?.schoolDivision || primary.schoolDivision,
      schoolKind: codeInfo?.schoolKind || primary.schoolKind,
      region: primary.region,
      estb: primary.estb,
      campusCount: campuses.length,
      enrolledTotal: args.enrolledByRep.get(repCode) ?? null,
      studentAidRestrict: campuses.some((r) => isFlag(r.studentAidRestrict))
        ? "해당"
        : "",
      provisionalBoard: campuses.some((r) => isFlag(r.provisionalBoard))
        ? "해당"
        : "",
      noSettlement: args.noSettlementCodes.has(repCode) ? "해당" : "",
      fundShortage: args.shortageCodes.has(repCode) ? "해당" : "",
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

function parseFundShortageCodes(
  raw: Record<string, string>[],
  year: number,
): Set<string> {
  const codes = new Set<string>();
  for (const row of raw) {
    if (parseYearText(row.year ?? "") !== year) continue;
    const total = Number(String(row.total_funds ?? "").replace(/,/g, ""));
    if (!Number.isFinite(total) || total >= 0) continue;
    const code = normalizeSchoolCodeText(row.school_rep_code ?? "");
    if (code) codes.add(code);
  }
  return codes;
}

export async function loadCompetitivenessTargetUnivMock(
  query: CompetitivenessTargetUnivQuery = {},
): Promise<CompetitivenessTargetUnivData> {
  const [targetRaw, schoolCodeRaw, fundRepRaw, enrolledUgRaw, enrolledGradRaw] =
    await Promise.all([
      readCsvFile("univMapAnalysisTarget").catch(() => []),
      readCsvFile("financeAnalysisSchoolCode").catch(() => []),
      readCsvFile("financeAnalysisFundSecureRateRep").catch(() => []),
      readCsvFile("univMapEnrolledStudentsUndergrad").catch(() => []),
      readCsvFile("univMapEnrolledStudentsGrad").catch(() => []),
    ]);

  const campusesAll = targetRaw
    .map(parseTargetCampus)
    .filter((row): row is TargetCampus => row != null);
  const schoolCodeAll = schoolCodeRaw
    .map(parseSchoolCodeInfo)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [...new Set(campusesAll.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (years[0] ?? null);

  const rosterYears = years;
  const rosterYear =
    displayYear != null ? pickNearestYear(rosterYears, displayYear) : null;
  const roster =
    rosterYear != null
      ? campusesAll.filter((row) => row.year === rosterYear)
      : [];

  const schoolCodeYears = [
    ...new Set(schoolCodeAll.map((r) => r.year)),
  ].sort((a, b) => b - a);
  const schoolCodeYear =
    displayYear != null
      ? pickNearestYear(schoolCodeYears, displayYear)
      : null;
  const schoolCodeSlice =
    schoolCodeYear != null
      ? schoolCodeAll.filter((row) => row.year === schoolCodeYear)
      : [];
  const schoolCodeByStd = new Map<string, SchoolCodeInfo>();
  const schoolCodeByRep = new Map<string, SchoolCodeInfo[]>();
  for (const row of schoolCodeSlice) {
    schoolCodeByStd.set(row.schoolCodeStd, row);
    if (!row.schoolRepCode) continue;
    const list = schoolCodeByRep.get(row.schoolRepCode);
    if (list) list.push(row);
    else schoolCodeByRep.set(row.schoolRepCode, [row]);
  }

  const settlementYear = displayYear != null ? displayYear - 1 : null;
  const fundYears = [
    ...new Set(
      fundRepRaw
        .map((row) => parseYearText(row.year ?? ""))
        .filter((year): year is number => year != null),
    ),
  ].sort((a, b) => b - a);
  const fundSecureYear =
    settlementYear != null && fundYears.includes(settlementYear)
      ? settlementYear
      : null;
  const shortageCodes =
    fundSecureYear != null
      ? parseFundShortageCodes(fundRepRaw, fundSecureYear)
      : new Set<string>();
  const noSettlementCodes =
    settlementYear != null
      ? parseNoSettlementCodes(campusesAll, settlementYear)
      : new Set<string>();

  const enrolledYears = [
    ...new Set(
      enrolledUgRaw
        .map((row) => parseYearText(row.year_text ?? ""))
        .filter((year): year is number => year != null),
    ),
  ].sort((a, b) => b - a);
  const enrolledYear =
    displayYear != null && enrolledYears.includes(displayYear)
      ? displayYear
      : null;
  const enrolledRoster =
    rosterYear != null
      ? targetRaw
          .map(parseAnalysisTargetCampus)
          .filter(
            (row): row is AnalysisTargetCampus =>
              row != null && row.year === rosterYear,
          )
      : [];
  const enrolledCounts =
    enrolledYear != null
      ? buildEnrolledStudentCountsByRep({
          year: enrolledYear,
          roster: enrolledRoster,
          undergrad: enrolledUgRaw
            .map(parseAlimiEnrolledStudentsUndergrad)
            .filter(
              (row): row is NonNullable<typeof row> => row != null,
            ),
          grad: enrolledGradRaw
            .map(parseAlimiEnrolledStudentsGrad)
            .filter(
              (row): row is NonNullable<typeof row> => row != null,
            ),
        })
      : null;
  const enrolledUniv = enrolledCounts?.university ?? new Map<string, number>();
  const enrolledJc = enrolledCounts?.juniorCollege ?? new Map<string, number>();

  const tab = query.tab ?? "target";
  const cohort = query.cohort ?? "university";
  const regionFilter = query.region?.trim() ?? "";
  const q = query.q?.trim().toLowerCase() ?? "";

  const empty: CompetitivenessTargetUnivData = {
    years,
    displayYear,
    rosterYear,
    schoolCodeYear,
    fundSecureYear,
    enrolledYear,
    tab,
    cohort,
    cohortCounts: { university: 0, "junior-college": 0 },
    rows: [],
    allCohortRows: { university: [], "junior-college": [] },
    filterOptions: { regions: [] },
    filters: { region: regionFilter, q },
    flagCounts: {
      studentAidRestrict: 0,
      provisionalBoard: 0,
      noSettlement: 0,
      fundShortage: 0,
    },
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  const allCohortRows = {
    university: buildRows({
      displayYear,
      campuses: roster,
      cohort: "university",
      schoolCodeByStd,
      schoolCodeByRep,
      shortageCodes,
      noSettlementCodes,
      enrolledByRep: enrolledUniv,
    }),
    "junior-college": buildRows({
      displayYear,
      campuses: roster,
      cohort: "junior-college",
      schoolCodeByStd,
      schoolCodeByRep,
      shortageCodes,
      noSettlementCodes,
      enrolledByRep: enrolledJc,
    }),
  };

  const source = allCohortRows[cohort];
  const regions = [
    ...new Set(source.map((r) => r.region).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "ko"));

  const rows = source.filter((row) => {
    if (q) {
      const hay = `${row.schoolRepName} ${row.schoolRepCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return {
    years,
    displayYear,
    rosterYear,
    schoolCodeYear,
    fundSecureYear,
    enrolledYear,
    tab,
    cohort,
    cohortCounts: {
      university: allCohortRows.university.length,
      "junior-college": allCohortRows["junior-college"].length,
    },
    rows,
    allCohortRows,
    filterOptions: { regions },
    filters: { region: regionFilter, q },
    flagCounts: countFlags([
      ...allCohortRows.university,
      ...allCohortRows["junior-college"],
    ]),
    hasData: true,
  };
}

function countFlags(rows: CompetitivenessTargetUnivRow[]) {
  return {
    studentAidRestrict: rows.filter((r) => r.studentAidRestrict === "해당")
      .length,
    provisionalBoard: rows.filter((r) => r.provisionalBoard === "해당").length,
    noSettlement: rows.filter((r) => r.noSettlement === "해당").length,
    fundShortage: rows.filter((r) => r.fundShortage === "해당").length,
  };
}
