export const ALL_UNIVERSITIES_COHORT = "all-universities" as const;
export type AllUniversitiesCohort = typeof ALL_UNIVERSITIES_COHORT;

export function isAllUniversitiesCohort(
  value: string | undefined | null,
): value is AllUniversitiesCohort {
  return value === ALL_UNIVERSITIES_COHORT;
}

export function isJuniorSchoolDivision(schoolDivision: string): boolean {
  return schoolDivision.includes("전문");
}

export type TwoSchoolViewCohort =
  | "university"
  | "junior-college"
  | "all-universities";

export const TWO_SCHOOL_VIEW_TABS: {
  id: TwoSchoolViewCohort;
  label: string;
}[] = [
  { id: "university", label: "대학" },
  { id: "junior-college", label: "전문대학" },
  { id: "all-universities", label: "전체대학" },
];

export function parseTwoSchoolViewCohort(
  value: string | undefined,
): TwoSchoolViewCohort {
  if (value === "junior-college" || value === "all-universities") return value;
  return "university";
}

export function concatAllUniversityRows<T>(university: T[], junior: T[]): T[] {
  return [...university, ...junior];
}

export function sourceRowsForTwoSchoolView<T>(
  all: Record<"university" | "junior-college", T[]>,
  cohort: TwoSchoolViewCohort,
): T[] {
  if (cohort === "all-universities") {
    return concatAllUniversityRows(all.university, all["junior-college"]);
  }
  return all[cohort];
}

export function allUniversitiesCount(
  counts: Record<"university" | "junior-college", number>,
): number {
  return counts.university + counts["junior-college"];
}

export function twoSchoolViewTabCount(
  counts: Record<"university" | "junior-college", number>,
  id: TwoSchoolViewCohort,
): number {
  if (id === "all-universities") return allUniversitiesCount(counts);
  return counts[id];
}

export function twoSchoolRowLabel(schoolDivision: string): string {
  return isJuniorSchoolDivision(schoolDivision) ? "전문대학" : "대학";
}

export type StudentFillViewCohort =
  | "university"
  | "junior-college"
  | "graduate"
  | "combined"
  | "all-universities";

export const STUDENT_FILL_VIEW_TABS: {
  id: StudentFillViewCohort;
  label: string;
}[] = [
  { id: "university", label: "대학" },
  { id: "graduate", label: "대학원" },
  { id: "combined", label: "대학통합" },
  { id: "junior-college", label: "전문대학" },
  { id: "all-universities", label: "전체대학" },
];

export function parseStudentFillViewCohort(
  value: string | undefined,
): StudentFillViewCohort {
  if (
    value === "junior-college" ||
    value === "graduate" ||
    value === "combined" ||
    value === "all-universities"
  ) {
    return value;
  }
  return "university";
}

export function sourceRowsForStudentFillView<T>(
  all: Record<"university" | "junior-college" | "graduate" | "combined", T[]>,
  cohort: StudentFillViewCohort,
): T[] {
  if (cohort === "all-universities") {
    return concatAllUniversityRows(all.combined, all["junior-college"]);
  }
  return all[cohort];
}

export function studentFillViewCounts(
  all: Record<"university" | "junior-college" | "graduate" | "combined", { length: number }>,
): Record<StudentFillViewCohort, number> {
  return {
    university: all.university.length,
    "junior-college": all["junior-college"].length,
    graduate: all.graduate.length,
    combined: all.combined.length,
    "all-universities": all.combined.length + all["junior-college"].length,
  };
}

export function emptyStudentFillViewCounts(): Record<
  StudentFillViewCohort,
  number
> {
  return {
    university: 0,
    "junior-college": 0,
    graduate: 0,
    combined: 0,
    "all-universities": 0,
  };
}

export function studentFillRowLabel(schoolDivision: string): string {
  return isJuniorSchoolDivision(schoolDivision) ? "전문대학" : "대학통합";
}

export function studentFillSchoolKind(schoolDivision: string): string {
  return isJuniorSchoolDivision(schoolDivision) ? "전문대학" : "대학";
}

export function emptyStudentFillCohortRows<T>(): Record<
  "university" | "junior-college" | "graduate" | "combined",
  T[]
> {
  return {
    university: [],
    "junior-college": [],
    graduate: [],
    combined: [],
  };
}

export function splitTwoSchoolByDivision<T extends { schoolDivision: string }>(
  rows: T[],
): Record<"university" | "junior-college", T[]> {
  const university: T[] = [];
  const junior: T[] = [];
  for (const row of rows) {
    if (isJuniorSchoolDivision(row.schoolDivision)) junior.push(row);
    else university.push(row);
  }
  return { university, "junior-college": junior };
}
