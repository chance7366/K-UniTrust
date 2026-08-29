import {
  studentFillRowMatchesEstb,
  type StudentFillEstbFilter,
} from "./cohort-rules";
import type { StudentFillSchoolRow } from "./types";

export type SfaMetroFilter = "all" | "metro" | "regional";
export type SfaSchoolKindFilter = "all" | "university" | "junior-college";

export type SfaComprehensiveFilter = {
  analysisYear: number;
  metro: SfaMetroFilter;
  estb: StudentFillEstbFilter;
  schoolKind: SfaSchoolKindFilter;
};

export function parseSfaMetroFilter(value: unknown): SfaMetroFilter {
  if (value === "metro" || value === "regional" || value === "all") return value;
  return "all";
}

export function parseSfaEstbFilter(value: unknown): StudentFillEstbFilter {
  if (value === "public" || value === "private" || value === "all") return value;
  return "all";
}

export function parseSfaSchoolKindFilter(value: unknown): SfaSchoolKindFilter {
  if (value === "university" || value === "junior-college" || value === "all") {
    return value;
  }
  return "all";
}

export function comprehensiveFilterKey(filter: SfaComprehensiveFilter): string {
  return `${filter.analysisYear}_${filter.metro}_${filter.estb}_${filter.schoolKind}`;
}

export function comprehensiveFilterLabel(filter: SfaComprehensiveFilter): string {
  const metro =
    filter.metro === "metro" ? "수도권" : filter.metro === "regional" ? "비수도권" : "전국";
  const estb =
    filter.estb === "public" ? "국공립" : filter.estb === "private" ? "사립" : "국공사립";
  const kind =
    filter.schoolKind === "university"
      ? "대학"
      : filter.schoolKind === "junior-college"
        ? "전문대학"
        : "전체대학";
  return `${filter.analysisYear}년 · ${metro} · ${estb} · ${kind}`;
}

export function studentFillRowMatchesMetro(
  row: StudentFillSchoolRow,
  metro: SfaMetroFilter,
): boolean {
  if (metro === "all") return true;
  if (metro === "metro") return row.metro === "수도권";
  return row.metro === "비수도권";
}

export function studentFillRowMatchesSchoolKind(
  row: StudentFillSchoolRow,
  schoolKind: SfaSchoolKindFilter,
): boolean {
  if (schoolKind === "all") return true;
  if (schoolKind === "junior-college") return row.schoolDivision === "전문대학";
  return row.schoolDivision === "대학";
}

export function filterStudentFillSchools(
  schools: StudentFillSchoolRow[],
  filter: Pick<SfaComprehensiveFilter, "metro" | "estb" | "schoolKind">,
): StudentFillSchoolRow[] {
  return schools.filter(
    (row) =>
      studentFillRowMatchesMetro(row, filter.metro) &&
      studentFillRowMatchesEstb(row.estb, filter.estb) &&
      studentFillRowMatchesSchoolKind(row, filter.schoolKind),
  );
}