import { readCsvFile } from "@/lib/csv/read";

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type SchoolDivisionLookup = {
  /** @deprecated Prefer lookupByStd or lookupByRep */
  lookup(year: number, schoolCodeStd: string): string;
  lookupByStd(year: number, schoolCodeStd: string): string;
  lookupByRep(year: number, schoolRepCode: string): string;
  schoolCodeYears: number[];
};

function resolveSchoolCodeYear(
  targetYear: number,
  availableYears: number[],
): number | null {
  if (!availableYears.length) return null;
  if (availableYears.includes(targetYear)) return targetYear;
  const prior = availableYears.filter((y) => y <= targetYear);
  if (prior.length) return Math.max(...prior);
  return Math.min(...availableYears);
}

export function buildSchoolDivisionLookup(
  schoolCodeRows: Record<string, string>[],
): SchoolDivisionLookup {
  const byStd = new Map<number, Map<string, string>>();
  const byRep = new Map<number, Map<string, string>>();
  const yearSet = new Set<number>();

  for (const row of schoolCodeRows) {
    const year = num(row.year);
    if (!year) continue;
    yearSet.add(year);

    const division = row.school_division?.trim() ?? "";
    if (!division) continue;

    const std = row.school_code_std?.trim();
    const rep = row.school_rep_code?.trim();

    if (std) {
      if (!byStd.has(year)) byStd.set(year, new Map());
      byStd.get(year)!.set(std, division);
    }
    if (rep) {
      if (!byRep.has(year)) byRep.set(year, new Map());
      byRep.get(year)!.set(rep, division);
    }
  }

  const schoolCodeYears = [...yearSet].sort((a, b) => a - b);

  function resolveFromMap(
    year: number,
    code: string,
    mapByYear: Map<number, Map<string, string>>,
  ): string {
    const trimmed = code.trim();
    if (!trimmed) return "";
    const resolvedYear = resolveSchoolCodeYear(year, schoolCodeYears);
    if (resolvedYear == null) return "";
    return mapByYear.get(resolvedYear)?.get(trimmed) ?? "";
  }

  return {
    schoolCodeYears,
    lookup(year: number, schoolCodeStd: string): string {
      return resolveFromMap(year, schoolCodeStd, byStd);
    },
    lookupByStd(year: number, schoolCodeStd: string): string {
      return resolveFromMap(year, schoolCodeStd, byStd);
    },
    lookupByRep(year: number, schoolRepCode: string): string {
      return resolveFromMap(year, schoolRepCode, byRep);
    },
  };
}

export type SchoolKindLookup = {
  lookupByStd(schoolCodeStd: string): string;
};

export function buildSchoolKindLookup(
  schoolCodeRows: Record<string, string>[],
): SchoolKindLookup {
  const byStd = new Map<number, Map<string, string>>();
  const yearSet = new Set<number>();

  for (const row of schoolCodeRows) {
    const year = num(row.year);
    if (!year) continue;
    yearSet.add(year);

    const kind = row.school_kind?.trim() ?? "";
    const std = row.school_code_std?.trim();
    if (!kind || !std) continue;

    if (!byStd.has(year)) byStd.set(year, new Map());
    byStd.get(year)!.set(std, kind);
  }

  const schoolCodeYears = [...yearSet].sort((a, b) => a - b);
  const latestYear = schoolCodeYears.at(-1) ?? null;

  return {
    lookupByStd(schoolCodeStd: string): string {
      const trimmed = schoolCodeStd.trim();
      if (!trimmed || latestYear == null) return "";
      return byStd.get(latestYear)?.get(trimmed) ?? "";
    },
  };
}

export async function loadSchoolKindLookup(): Promise<SchoolKindLookup> {
  const rows = await readCsvFile("financeAnalysisSchoolCode").catch(() => []);
  return buildSchoolKindLookup(rows);
}

export async function loadSchoolDivisionLookup(): Promise<SchoolDivisionLookup> {
  const rows = await readCsvFile("financeAnalysisSchoolCode").catch(() => []);
  return buildSchoolDivisionLookup(rows);
}

export function enrichRowsWithSchoolDivision(
  rows: Record<string, string>[],
  lookup: SchoolDivisionLookup,
): Record<string, string>[] {
  return rows.map((row) => {
    const year = num(row.year);
    if (!year) return row;

    const std = row.school_code_std?.trim() ?? "";
    const rep = row.school_rep_code?.trim() ?? "";
    const division = std
      ? lookup.lookupByStd(year, std)
      : rep
        ? lookup.lookupByRep(year, rep)
        : "";

    return division ? { ...row, school_division: division } : row;
  });
}
