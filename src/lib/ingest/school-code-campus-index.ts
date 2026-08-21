import { readCsvFile } from "@/lib/csv/read";

const INVALID_CODES = new Set(["#N/A", "N/A", ""]);
export const MAIN_BRANCH_LABEL = "본교";

export type SchoolCampusEntry = {
  schoolCodeStd: string;
  schoolRepCode: string;
  schoolRepName: string;
  schoolName: string;
  mainBranchName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
};

export type SchoolCampusIndex = {
  byCode: Map<string, SchoolCampusEntry>;
  byName: Map<string, SchoolCampusEntry>;
  codeYears: number[];
  resolve(
    year: number,
    rawCode: string,
    rawName?: string,
  ): SchoolCampusEntry | null;
};

function num(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, "").trim();
}

export function padSchoolCode(value: string): string {
  const s = value.trim();
  if (!s) return "";
  return s.padStart(7, "0");
}

function resolveSchoolCodeYear(
  year: number,
  availableYears: number[],
): number | null {
  if (!availableYears.length) return null;
  if (availableYears.includes(year)) return year;
  const prior = availableYears.filter((y) => y <= year);
  if (prior.length) return Math.max(...prior);
  return Math.min(...availableYears);
}

export function buildSchoolCampusIndex(
  rows: Record<string, string>[],
): SchoolCampusIndex {
  const byCode = new Map<string, SchoolCampusEntry>();
  const byName = new Map<string, SchoolCampusEntry>();
  const years = new Set<number>();

  for (const row of rows) {
    const year = num(row.year);
    const code = padSchoolCode(row.school_code_std ?? "");
    if (!year || !code) continue;
    years.add(year);

    const rep = padSchoolCode(row.school_rep_code ?? "") || code;
    const entry: SchoolCampusEntry = {
      schoolCodeStd: code,
      schoolRepCode: rep,
      schoolRepName:
        row.school_rep_name?.trim() || row.school_name?.trim() || "",
      schoolName: row.school_name?.trim() || "",
      mainBranchName: row.main_branch_name?.trim() || "",
      schoolDivision: row.school_division?.trim() || "",
      schoolKind: row.school_kind?.trim() || "",
      region: row.region?.trim() || "",
      estb: row.estb?.trim() || "",
    };

    byCode.set(`${year}:${code}`, entry);
    if (entry.schoolName) {
      byName.set(`${year}:${normalizeName(entry.schoolName)}`, entry);
    }
  }

  const codeYears = [...years].sort((a, b) => a - b);

  function resolve(
    year: number,
    rawCode: string,
    rawName = "",
  ): SchoolCampusEntry | null {
    const lookupYear = resolveSchoolCodeYear(year, codeYears);
    if (lookupYear == null) return null;

    const code = padSchoolCode(rawCode);
    const name = rawName.trim();
    if (code && !INVALID_CODES.has(rawCode.trim())) {
      const hit = byCode.get(`${lookupYear}:${code}`);
      if (hit) return hit;
    }
    if (name) {
      const hit = byName.get(`${lookupYear}:${normalizeName(name)}`);
      if (hit) return hit;
    }
    return null;
  }

  return { byCode, byName, codeYears, resolve };
}

export async function loadSchoolCampusIndex(): Promise<SchoolCampusIndex> {
  const rows = await readCsvFile("financeAnalysisSchoolCode").catch(() => []);
  return buildSchoolCampusIndex(rows);
}

export function outputIdentityFromCampus(campus: SchoolCampusEntry): {
  code: string;
  name: string;
} {
  if (campus.mainBranchName === MAIN_BRANCH_LABEL) {
    return {
      code: campus.schoolCodeStd,
      name: campus.schoolRepName || campus.schoolName,
    };
  }
  return {
    code: campus.schoolRepCode,
    name: campus.schoolRepName || campus.schoolName,
  };
}
