import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import { rowMatchesTableFilters } from "@/lib/analysis/table-filter-utils";

export type AdvancedChartFilters = {
  year: number;
  estb: string;
  schoolDivision: string;
  schoolKinds: string[];
};

export type AdvancedChartFilterOptions = {
  estbs: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
};

export type AdvancedChartFilterRow = {
  year: number;
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  schoolName?: string;
  region?: string;
};

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

/** 시계열·연도 필터용 오름차순 (학생충원 통계분석과 동일) */
export function sortAdvancedChartYears(years: number[]): number[] {
  return [...new Set(years)].sort((a, b) => a - b);
}

/** 전년 대비 선을 그릴 수 있는 최신 연도 */
export function latestAdvancedChartYear(years: number[]): number {
  return years.length ? Math.max(...years) : new Date().getFullYear();
}

export function resolveAdvancedChartEstb(
  filters: Pick<AdvancedChartFilters, "estb">,
  fixedEstb?: string,
): string {
  return fixedEstb ?? filters.estb;
}

export function matchesAdvancedChartRowFilters(
  row: AdvancedChartFilterRow,
  filters: Pick<AdvancedChartFilters, "estb" | "schoolDivision" | "schoolKinds">,
  fixedEstb?: string,
): boolean {
  return rowMatchesTableFilters(row, {
    estb: resolveAdvancedChartEstb(filters, fixedEstb),
    schoolDivision: filters.schoolDivision,
    schoolKinds: filters.schoolKinds,
  });
}

export function filterAdvancedChartRows<T extends AdvancedChartFilterRow>(
  rows: T[],
  filters: AdvancedChartFilters,
  options?: { fixedEstb?: string; matchYear?: number },
): T[] {
  const year = options?.matchYear ?? filters.year;
  return rows.filter((row) => {
    if (row.year !== year) return false;
    return matchesAdvancedChartRowFilters(row, filters, options?.fixedEstb);
  });
}

export function buildAdvancedChartFilterOptions(
  yearRows: AdvancedChartFilterRow[],
  filters: Pick<AdvancedChartFilters, "estb" | "schoolDivision">,
  fixedEstb?: string,
): AdvancedChartFilterOptions {
  const estbFilter = resolveAdvancedChartEstb(filters, fixedEstb);
  const estbSet = new Set<string>();
  const schoolDivisionSet = new Set<string>();
  const optionRows: Parameters<typeof getTableSchoolKindOptions>[0] = [];

  for (const row of yearRows) {
    if (row.estb) estbSet.add(row.estb);
    if (row.schoolDivision) schoolDivisionSet.add(row.schoolDivision);
    optionRows.push({
      estb: row.estb,
      schoolKind: row.schoolKind,
      schoolDivision: row.schoolDivision,
    });
  }

  return {
    estbs: sortKo([...estbSet]),
    schoolDivisions: sortKo([...schoolDivisionSet]),
    schoolKinds: getTableSchoolKindOptions(
      optionRows,
      estbFilter,
      filters.schoolDivision,
    ),
  };
}

export function hasAdvancedChartActiveFilters(
  filters: Pick<AdvancedChartFilters, "estb" | "schoolDivision" | "schoolKinds">,
  fixedEstb?: string,
): boolean {
  return (
    (!fixedEstb && filters.estb !== "") ||
    filters.schoolDivision !== "" ||
    filters.schoolKinds.length > 0
  );
}
