import {
  groupAnalysisTargetByRep,
  normalizeRepName,
  normalizeSchoolCodeText,
  parseAnalysisTargetCampus,
  parseYearText,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import type { EnrolledScaleLookupJson } from "@/lib/analysis/school-scale-trend";
import { readCsvFile } from "@/lib/csv/read";

/** 대학알리미 재적학생 · 재학생(A) 계/소계 — cells_json 열 */
const UNDERGRAD_ENROLLED_A_TOTAL = 8;
const GRAD_ENROLLED_A_TOTAL = 9;

export type AlimiEnrolledStudentUndergrad = {
  year: number;
  schoolCodeStd: string;
  enrolledA: number;
};

export type AlimiEnrolledStudentGrad = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  programName: string;
  enrolledA: number;
};

function parseNum(value: string | undefined): number {
  if (value == null) return 0;
  const text = value.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!text || text === "-" || text === "—" || text === "–") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function parseCellsJson(raw: string | undefined): string[] {
  try {
    const cells = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(cells) ? cells.map((c) => String(c ?? "")) : [];
  } catch {
    return [];
  }
}

export function parseAlimiEnrolledStudentsUndergrad(
  raw: Record<string, string>,
): AlimiEnrolledStudentUndergrad | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    enrolledA: parseNum(cells[UNDERGRAD_ENROLLED_A_TOTAL]),
  };
}

export function parseAlimiEnrolledStudentsGrad(
  raw: Record<string, string>,
): AlimiEnrolledStudentGrad | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: cells[2]?.trim() ?? "",
    programName: cells[8]?.trim() ?? "",
    enrolledA: parseNum(cells[GRAD_ENROLLED_A_TOTAL]),
  };
}

export type EnrolledStudentCountMaps = {
  year: number;
  university: Map<string, number>;
  juniorCollege: Map<string, number>;
};

/** 대표학교별 학부 재학생(A) · 대학원 재학생(A) */
export type EnrolledASplitMaps = {
  year: number;
  undergrad: Map<string, number>;
  graduate: Map<string, number>;
};

function sumUndergrad(
  campuses: AnalysisTargetCampus[],
  ugByCode: Map<string, number>,
): { total: number; hit: number } {
  let total = 0;
  let hit = 0;
  for (const campus of campuses) {
    const value = ugByCode.get(campus.schoolCodeStd);
    if (value == null) continue;
    hit += 1;
    total += value;
  }
  return { total, hit };
}

function sumGrad(
  repCode: string,
  campuses: AnalysisTargetCampus[],
  univGroups: Map<string, AnalysisTargetCampus[]>,
  gradGroups: Map<string, AnalysisTargetCampus[]>,
  primaryName: string,
  grByCode: Map<string, AlimiEnrolledStudentGrad[]>,
  grByName: Map<string, AlimiEnrolledStudentGrad[]>,
): { total: number; hit: number } {
  const lookupCodes = new Set<string>();
  for (const campus of campuses) lookupCodes.add(campus.schoolCodeStd);
  for (const campus of univGroups.get(repCode) ?? []) {
    lookupCodes.add(campus.schoolCodeStd);
  }
  for (const campus of gradGroups.get(repCode) ?? []) {
    lookupCodes.add(campus.schoolCodeStd);
  }

  const used = new Set<string>();
  let total = 0;
  let hit = 0;
  const addProgram = (program: AlimiEnrolledStudentGrad) => {
    const key = `${program.schoolCodeStd}::${program.programName}`;
    if (used.has(key)) return;
    used.add(key);
    hit += 1;
    total += program.enrolledA;
  };

  for (const code of lookupCodes) {
    for (const program of grByCode.get(code) ?? []) addProgram(program);
  }
  if (hit === 0) {
    for (const program of grByName.get(normalizeRepName(primaryName)) ?? []) {
      addProgram(program);
    }
  }
  return { total, hit };
}

export function buildEnrolledStudentCountsByRep(args: {
  year: number;
  roster: AnalysisTargetCampus[];
  undergrad: AlimiEnrolledStudentUndergrad[];
  grad: AlimiEnrolledStudentGrad[];
}): EnrolledStudentCountMaps {
  const { year, roster, undergrad, grad } = args;
  const ugByCode = new Map<string, number>();
  for (const row of undergrad) {
    if (row.year !== year) continue;
    ugByCode.set(row.schoolCodeStd, (ugByCode.get(row.schoolCodeStd) ?? 0) + row.enrolledA);
  }

  const grByCode = new Map<string, AlimiEnrolledStudentGrad[]>();
  const grByName = new Map<string, AlimiEnrolledStudentGrad[]>();
  for (const row of grad) {
    if (row.year !== year) continue;
    const byCode = grByCode.get(row.schoolCodeStd);
    if (byCode) byCode.push(row);
    else grByCode.set(row.schoolCodeStd, [row]);
    const nameKey = normalizeRepName(row.schoolName);
    if (!nameKey) continue;
    const byName = grByName.get(nameKey);
    if (byName) byName.push(row);
    else grByName.set(nameKey, [row]);
  }

  const univGroups = groupAnalysisTargetByRep(roster, "대학");
  const jcGroups = groupAnalysisTargetByRep(roster, "전문대학");
  const gradGroups = groupAnalysisTargetByRep(roster, "대학원");

  const university = new Map<string, number>();
  for (const [repCode, campuses] of univGroups) {
    const ug = sumUndergrad(campuses, ugByCode);
    const gr = sumGrad(
      repCode,
      campuses,
      univGroups,
      gradGroups,
      campuses[0]?.schoolRepName ?? "",
      grByCode,
      grByName,
    );
    if (ug.hit === 0 && gr.hit === 0) continue;
    university.set(repCode, ug.total + gr.total);
  }

  const juniorCollege = new Map<string, number>();
  for (const [repCode, campuses] of jcGroups) {
    const ug = sumUndergrad(campuses, ugByCode);
    if (ug.hit === 0) continue;
    juniorCollege.set(repCode, ug.total);
  }

  return { year, university, juniorCollege };
}

export function rosterForYear(
  rosterAll: AnalysisTargetCampus[],
  rosterYears: number[],
  year: number,
): AnalysisTargetCampus[] {
  const rosterYear = rosterYears.includes(year)
    ? year
    : (rosterYears.find((y) => y <= year) ?? rosterYears[0] ?? year);
  return rosterAll.filter((row) => row.year === rosterYear);
}

export function buildEnrolledASplitByRep(args: {
  year: number;
  roster: AnalysisTargetCampus[];
  undergrad: AlimiEnrolledStudentUndergrad[];
  grad: AlimiEnrolledStudentGrad[];
}): EnrolledASplitMaps {
  const { year, roster, undergrad, grad } = args;
  const ugByCode = new Map<string, number>();
  for (const row of undergrad) {
    if (row.year !== year) continue;
    ugByCode.set(row.schoolCodeStd, (ugByCode.get(row.schoolCodeStd) ?? 0) + row.enrolledA);
  }

  const grByCode = new Map<string, AlimiEnrolledStudentGrad[]>();
  const grByName = new Map<string, AlimiEnrolledStudentGrad[]>();
  for (const row of grad) {
    if (row.year !== year) continue;
    const byCode = grByCode.get(row.schoolCodeStd);
    if (byCode) byCode.push(row);
    else grByCode.set(row.schoolCodeStd, [row]);
    const nameKey = normalizeRepName(row.schoolName);
    if (!nameKey) continue;
    const byName = grByName.get(nameKey);
    if (byName) byName.push(row);
    else grByName.set(nameKey, [row]);
  }

  const univGroups = groupAnalysisTargetByRep(roster, "대학");
  const jcGroups = groupAnalysisTargetByRep(roster, "전문대학");
  const gradGroups = groupAnalysisTargetByRep(roster, "대학원");

  const undergradMap = new Map<string, number>();
  const graduateMap = new Map<string, number>();

  for (const [repCode, campuses] of univGroups) {
    const ug = sumUndergrad(campuses, ugByCode);
    const gr = sumGrad(
      repCode,
      campuses,
      univGroups,
      gradGroups,
      campuses[0]?.schoolRepName ?? "",
      grByCode,
      grByName,
    );
    if (ug.hit > 0) undergradMap.set(repCode, ug.total);
    if (gr.hit > 0) graduateMap.set(repCode, gr.total);
  }

  for (const [repCode, campuses] of jcGroups) {
    const ug = sumUndergrad(campuses, ugByCode);
    if (ug.hit === 0) continue;
    undergradMap.set(repCode, ug.total);
  }

  return { year, undergrad: undergradMap, graduate: graduateMap };
}

async function loadEnrolledStudentSource() {
  const [targetRaw, undergradRaw, gradRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapEnrolledStudentsUndergrad").catch(() => []),
    readCsvFile("univMapEnrolledStudentsGrad").catch(() => []),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is AnalysisTargetCampus => row != null);
  const rosterYears = [
    ...new Set(rosterAll.map((row) => row.year)),
  ].sort((a, b) => b - a);
  const undergrad = undergradRaw
    .map(parseAlimiEnrolledStudentsUndergrad)
    .filter((row): row is AlimiEnrolledStudentUndergrad => row != null);
  const grad = gradRaw
    .map(parseAlimiEnrolledStudentsGrad)
    .filter((row): row is AlimiEnrolledStudentGrad => row != null);

  return { rosterAll, rosterYears, undergrad, grad };
}

export async function loadEnrolledStudentCountsByRep(
  year: number,
): Promise<EnrolledStudentCountMaps> {
  const { rosterAll, rosterYears, undergrad, grad } =
    await loadEnrolledStudentSource();
  return buildEnrolledStudentCountsByRep({
    year,
    roster: rosterForYear(rosterAll, rosterYears, year),
    undergrad,
    grad,
  });
}

export function serializeEnrolledScaleLookup(
  mapsList: EnrolledStudentCountMaps[],
): EnrolledScaleLookupJson {
  const out: EnrolledScaleLookupJson = {};
  for (const maps of mapsList) {
    out[String(maps.year)] = {
      university: Object.fromEntries(maps.university),
      juniorCollege: Object.fromEntries(maps.juniorCollege),
    };
  }
  return out;
}

export async function loadEnrolledScaleLookupJson(
  years: number[],
): Promise<EnrolledScaleLookupJson> {
  const unique = [...new Set(years.filter((y) => Number.isFinite(y)))];
  if (!unique.length) return {};
  const { rosterAll, rosterYears, undergrad, grad } =
    await loadEnrolledStudentSource();
  return serializeEnrolledScaleLookup(
    unique.map((year) =>
      buildEnrolledStudentCountsByRep({
        year,
        roster: rosterForYear(rosterAll, rosterYears, year),
        undergrad,
        grad,
      }),
    ),
  );
}

export function lookupEnrolledStudentCount(
  maps: EnrolledStudentCountMaps,
  schoolRepCode: string,
  kind: "university" | "junior-college",
): number | null {
  const code = normalizeSchoolCodeText(schoolRepCode);
  const value =
    kind === "junior-college"
      ? maps.juniorCollege.get(code)
      : maps.university.get(code);
  return value == null ? null : value;
}
