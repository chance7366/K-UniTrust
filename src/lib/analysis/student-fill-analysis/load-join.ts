import { parseAlimiDropoutUndergradRow } from "@/lib/analysis/dropout-rate-rep-rollup";
import { parseAlimiEnrolledUndergradRow } from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import { parseYearText } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { readCsvFile } from "@/lib/csv/read";
import {
  loadSchoolCampusIndex,
  padSchoolCode,
  type SchoolCampusIndex,
} from "@/lib/ingest/school-code-campus-index";

import { isStudentFillEligibleCampus } from "./cohort-rules";
import { sourceYearForAnalysisYear } from "../student-fill-analysis-tabs";
import { pct, type StudentFillSchoolRow } from "./types";

export type EnrolledFillRep = {
  studentQuota: number;
  recruitmentStop: number;
  enrolledFill: number;
  enrolledFillWithin: number;
  enrolledFillOutside: number;
};

export type DropoutRep = {
  enrolledStudents: number;
  dropouts: number;
  freshmanStudents: number;
  freshmanDropouts: number;
};

export type ForeignRep = {
  degreeA: number;
  jointB: number;
  trainingC: number;
  total: number;
  langAbilityCount: number;
};

export type ForeignDropoutRep = {
  degreeEnrolled: number;
  degreeDropouts: number;
  totalEnrolled: number;
  totalDropouts: number;
};

export type RosterRep = {
  enrolledA: number;
  enrolledAOutside: number;
  leave: number;
  defer: number;
  rosterTotal: number;
};

type StudentFillAuxMaps = {
  enrolled: Map<string, EnrolledFillRep>;
  dropout: Map<string, DropoutRep>;
  foreign: Map<string, ForeignRep>;
  foreignDropout: Map<string, ForeignDropoutRep>;
  roster: Map<string, RosterRep>;
};

const auxCache = new Map<number, Promise<StudentFillAuxMaps>>();

function parseCells(raw: string | undefined): string[] {
  try {
    const cells = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(cells) ? cells.map((c) => String(c ?? "")) : [];
  } catch {
    return [];
  }
}

function parseNum(value: string | undefined): number {
  if (value == null) return 0;
  const text = value.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!text || text === "-" || text === "—" || text === "–") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function eligible(raw: Record<string, string>): boolean {
  return isStudentFillEligibleCampus({
    estb: raw.estb ?? "",
    schoolKind: raw.school_kind ?? "",
    status: raw.status ?? "",
  });
}

function repCode(
  index: SchoolCampusIndex,
  year: number,
  schoolCodeStd: string,
  schoolName: string,
): string {
  const hit = index.resolve(year, schoolCodeStd, schoolName);
  return padSchoolCode(hit?.schoolRepCode || schoolCodeStd);
}

function parseForeignStudents(raw: Record<string, string>): {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  total: number;
  degreeA: number;
  jointB: number;
  trainingC: number;
  langAbilityCount: number;
} | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = padSchoolCode(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd || !eligible(raw)) return null;
  const cells = parseCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: (raw.school_name ?? "").trim(),
    total: parseNum(cells[7]),
    degreeA: parseNum(cells[8]),
    jointB: parseNum(cells[14]),
    trainingC: parseNum(cells[15]),
    langAbilityCount: parseNum(cells[20]),
  };
}

function parseForeignDropout(raw: Record<string, string>): {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  totalEnrolled: number;
  degreeEnrolled: number;
  totalDropouts: number;
  degreeDropouts: number;
} | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = padSchoolCode(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd || !eligible(raw)) return null;
  const cells = parseCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: (raw.school_name ?? "").trim(),
    totalEnrolled: parseNum(cells[7]),
    degreeEnrolled: parseNum(cells[8]),
    totalDropouts: parseNum(cells[14]),
    degreeDropouts: parseNum(cells[15]),
  };
}

function parseRoster(raw: Record<string, string>): {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  enrolledA: number;
  enrolledAOutside: number;
  leave: number;
  defer: number;
  rosterTotal: number;
} | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = padSchoolCode(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd || !eligible(raw)) return null;
  const cells = parseCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: (raw.school_name ?? "").trim(),
    enrolledA: parseNum(cells[8]),
    enrolledAOutside: parseNum(cells[10]),
    leave: parseNum(cells[15]),
    defer: parseNum(cells[22]),
    rosterTotal: parseNum(cells[29]),
  };
}

function addNum<T extends Record<string, number>>(map: Map<string, T>, key: string, patch: T) {
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { ...patch });
    return;
  }
  const next = { ...prev };
  for (const field of Object.keys(patch) as (keyof T)[]) {
    next[field] = ((prev[field] as number) + (patch[field] as number)) as T[keyof T];
  }
  map.set(key, next);
}

export async function loadStudentFillAuxByRep(analysisYear: number): Promise<StudentFillAuxMaps> {
  const enrolledYear = sourceYearForAnalysisYear(analysisYear, "enrolled");
  const rosterYear = sourceYearForAnalysisYear(analysisYear, "enrolled-students");
  const dropoutYear = sourceYearForAnalysisYear(analysisYear, "dropout");
  const foreignYear = sourceYearForAnalysisYear(analysisYear, "foreign");
  const foreignDropoutYear = sourceYearForAnalysisYear(analysisYear, "foreign-dropout");

  const [index, enrolledRaw, dropoutRaw, foreignRaw, foreignDropoutRaw, rosterRaw] =
    await Promise.all([
      loadSchoolCampusIndex(),
      readCsvFile("univMapEnrolledEnrollmentUndergrad").catch(() => []),
      readCsvFile("univMapDropoutRateUndergrad").catch(() => []),
      readCsvFile("univMapForeignStudentsUndergrad").catch(() => []),
      readCsvFile("univMapForeignDropoutUndergrad").catch(() => []),
      readCsvFile("univMapEnrolledStudentsUndergrad").catch(() => []),
    ]);

  const enrolled = new Map<string, EnrolledFillRep>();
  for (const raw of enrolledRaw) {
    if (!eligible(raw)) continue;
    const parsed = parseAlimiEnrolledUndergradRow(raw);
    if (!parsed || parsed.year !== enrolledYear || parsed.half !== "상반기") continue;
    const code = repCode(index, enrolledYear, parsed.schoolCodeStd, raw.school_name ?? "");
    addNum(enrolled, code, {
      studentQuota: parsed.studentQuota,
      recruitmentStop: parsed.recruitmentStop,
      enrolledFill: parsed.enrolled.total,
      enrolledFillWithin: parsed.enrolled.within,
      enrolledFillOutside: parsed.enrolled.outside,
    });
  }

  const dropout = new Map<string, DropoutRep>();
  for (const raw of dropoutRaw) {
    if (!eligible(raw)) continue;
    const parsed = parseAlimiDropoutUndergradRow(raw);
    if (!parsed || parsed.year !== dropoutYear) continue;
    const code = repCode(index, dropoutYear, parsed.schoolCodeStd, raw.school_name ?? "");
    addNum(dropout, code, {
      enrolledStudents: parsed.enrolled.students,
      dropouts: parsed.enrolled.dropouts,
      freshmanStudents: parsed.freshman.students,
      freshmanDropouts: parsed.freshman.dropouts,
    });
  }

  const foreign = new Map<string, ForeignRep>();
  for (const raw of foreignRaw) {
    const parsed = parseForeignStudents(raw);
    if (!parsed || parsed.year !== foreignYear) continue;
    const code = repCode(index, foreignYear, parsed.schoolCodeStd, parsed.schoolName);
    addNum(foreign, code, {
      degreeA: parsed.degreeA,
      jointB: parsed.jointB,
      trainingC: parsed.trainingC,
      total: parsed.total,
      langAbilityCount: parsed.langAbilityCount,
    });
  }

  const foreignDropout = new Map<string, ForeignDropoutRep>();
  for (const raw of foreignDropoutRaw) {
    const parsed = parseForeignDropout(raw);
    if (!parsed || parsed.year !== foreignDropoutYear) continue;
    const code = repCode(index, foreignDropoutYear, parsed.schoolCodeStd, parsed.schoolName);
    addNum(foreignDropout, code, {
      degreeEnrolled: parsed.degreeEnrolled,
      degreeDropouts: parsed.degreeDropouts,
      totalEnrolled: parsed.totalEnrolled,
      totalDropouts: parsed.totalDropouts,
    });
  }

  const roster = new Map<string, RosterRep>();
  for (const raw of rosterRaw) {
    const parsed = parseRoster(raw);
    if (!parsed || parsed.year !== rosterYear) continue;
    const code = repCode(index, rosterYear, parsed.schoolCodeStd, parsed.schoolName);
    addNum(roster, code, {
      enrolledA: parsed.enrolledA,
      enrolledAOutside: parsed.enrolledAOutside,
      leave: parsed.leave,
      defer: parsed.defer,
      rosterTotal: parsed.rosterTotal,
    });
  }

  return { enrolled, dropout, foreign, foreignDropout, roster };
}

export function loadStudentFillAuxByRepCached(analysisYear: number): Promise<StudentFillAuxMaps> {
  let pending = auxCache.get(analysisYear);
  if (!pending) {
    pending = loadStudentFillAuxByRep(analysisYear);
    auxCache.set(analysisYear, pending);
  }
  return pending;
}

export function applyStudentFillAux(
  schools: StudentFillSchoolRow[],
  aux: StudentFillAuxMaps,
): StudentFillSchoolRow[] {
  return schools.map((row) => {
    const code = padSchoolCode(row.schoolCodeStd);
    const enrolled = aux.enrolled.get(code);
    const dropout = aux.dropout.get(code);
    const foreign = aux.foreign.get(code);
    const foreignDropout = aux.foreignDropout.get(code);
    const roster = aux.roster.get(code);
    const denom = enrolled ? enrolled.studentQuota - enrolled.recruitmentStop : 0;
    return {
      ...row,
      studentQuota: enrolled ? enrolled.studentQuota : null,
      enrolledFill: enrolled ? enrolled.enrolledFill : null,
      enrolledFillDenom: enrolled ? Math.max(0, enrolled.studentQuota - enrolled.recruitmentStop) : null,
      enrolledFillRate: enrolled ? pct(enrolled.enrolledFill, denom) : null,
      enrolledFillRateIn: enrolled ? pct(enrolled.enrolledFillWithin, denom) : null,
      enrolledFillOutside: enrolled ? enrolled.enrolledFillOutside : null,
      enrolledFillOutShare: enrolled ? pct(enrolled.enrolledFillOutside, enrolled.enrolledFill) : null,
      enrolledOutside: roster ? roster.enrolledAOutside : null,
      enrolledOutShare: roster ? pct(roster.enrolledAOutside, roster.enrolledA) : null,
      rosterTotal: roster ? roster.rosterTotal : null,
      leaveCount: roster ? roster.leave : null,
      leaveShare: roster ? pct(roster.leave, roster.rosterTotal) : null,
      deferCount: roster ? roster.defer : null,
      deferShare: roster ? pct(roster.defer, roster.rosterTotal) : null,
      dropoutCount: dropout ? dropout.dropouts : null,
      dropoutEnrolled: dropout ? dropout.enrolledStudents : null,
      dropoutRate: dropout ? pct(dropout.dropouts, dropout.enrolledStudents) : null,
      freshmanDropoutCount: dropout ? dropout.freshmanDropouts : null,
      freshmanDropoutEnrolled: dropout ? dropout.freshmanStudents : null,
      freshmanDropoutRate: dropout ? pct(dropout.freshmanDropouts, dropout.freshmanStudents) : null,
      foreignDegree: foreign ? foreign.degreeA : null,
      foreignJoint: foreign ? foreign.jointB : null,
      foreignTraining: foreign ? foreign.trainingC : null,
      foreignTotal: foreign ? foreign.total : null,
      foreignShare: foreign ? pct(foreign.degreeA, row.enrolledTotal ?? 0) : null,
      langAbilityRate: foreign ? pct(foreign.langAbilityCount, foreign.degreeA) : null,
      foreignDropCount: foreignDropout ? foreignDropout.degreeDropouts : null,
      foreignDropEnrolled: foreignDropout ? foreignDropout.degreeEnrolled : null,
      foreignDropRate: foreignDropout
        ? pct(foreignDropout.degreeDropouts, foreignDropout.degreeEnrolled)
        : null,
      foreignDropAllCount: foreignDropout ? foreignDropout.totalDropouts : null,
      foreignDropAllEnrolled: foreignDropout ? foreignDropout.totalEnrolled : null,
      foreignDropAllRate: foreignDropout
        ? pct(foreignDropout.totalDropouts, foreignDropout.totalEnrolled)
        : null,
    };
  });
}

export async function attachStudentFillAux(
  schools: StudentFillSchoolRow[],
  analysisYear: number,
): Promise<StudentFillSchoolRow[]> {
  const aux = await loadStudentFillAuxByRepCached(analysisYear);
  return applyStudentFillAux(schools, aux);
}
