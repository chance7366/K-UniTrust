import { rowMatchesSchoolDivisionFilter } from "@/lib/analysis/school-division";

export function parseMultiFilterParam(value?: string): string[] {
  if (!value?.trim()) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function serializeMultiFilterParam(values: string[]): string | undefined {
  if (!values.length) return undefined;
  return values.join(",");
}

export function matchesMultiFilter(
  value: string,
  selected: string[],
): boolean {
  return selected.length === 0 || selected.includes(value);
}

export function matchesSingleFilter(value: string, filter: string): boolean {
  return !filter || value === filter;
}

export function compareSchoolNameKo(a: string, b: string): number {
  return a.localeCompare(b, "ko");
}

export function matchesSchoolNameSearch(
  schoolName: string,
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return schoolName.trim().toLowerCase().includes(q);
}

export function rowMatchesTableFilters(
  row: {
    estb?: string;
    schoolKind?: string;
    schoolDivision?: string;
    region?: string;
    schoolName?: string;
  },
  filters: {
    estb?: string;
    schoolDivision?: string;
    schoolKinds?: string[];
    regions?: string[];
    search?: string;
  },
): boolean {
  if (!matchesSingleFilter(row.estb ?? "", filters.estb ?? "")) return false;
  if (
    filters.schoolDivision &&
    !rowMatchesSchoolDivisionFilter(row, filters.schoolDivision)
  ) {
    return false;
  }
  if (!matchesMultiFilter(row.schoolKind ?? "", filters.schoolKinds ?? [])) {
    return false;
  }
  if (!matchesMultiFilter(row.region ?? "", filters.regions ?? [])) {
    return false;
  }
  if (
    filters.search &&
    !matchesSchoolNameSearch(row.schoolName ?? "", filters.search)
  ) {
    return false;
  }
  return true;
}
