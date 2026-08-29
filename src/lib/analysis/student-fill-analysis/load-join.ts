import { parseAlimiDropoutUndergradRow } from "@/lib/analysis/dropout-rate-rep-rollup";
import { parseAlimiEnrolledUndergradRow } from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import { parseYearText } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { loadCsvYearMapped } from "@/lib/csv/csv-year-load";
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

const AUX_CACHE_MAX = 3;
const auxCache = new Map<number, Promise<StudentFillAuxMaps>>();
const auxOrder: number[] = [];

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

/** 상반기 우선. 해당 연도에 상반기가 없으면(예: 2025) 하반기를 사용한다. */
const ENROLLED_HALF_PREF = ["상반기", "하반기"] as const;

function mergePreferredEnrolledHalf(
  byHalf: Map<string, Map<string, EnrolledFillRep>>,
): Map<string, EnrolledFillRep> {
  const merged = new Map<string, EnrolledFillRep>();
  for (const half of ENROLLED_HALF_PREF) {
    const slice = byHalf.get(half);
    if (!slice) continue;
    for (const [code, value] of slice) {
      if (!merged.has(code)) merged.set(code, value);
    }
  }
  return merged;
}

function alimiYearOf(row: Record<string, string>): number | null {
  return parseYearText(row.year_text ?? "");
}

type SlimEnrolled = {
  half: string;
  schoolCodeStd: string;
  schoolName: string;
  studentQuota: number;
  recruitmentStop: number;
  enrolledFill: number;
  enrolledFillWithin: number;
  enrolledFillOutside: number;
};

type SlimDropout = {
  schoolCodeStd: string;
  schoolName: string;
  enrolledStudents: number;
  dropouts: number;
  freshmanStudents: number;
  freshmanDropouts: number;
};

export async function loadStudentFillAuxByRep(analysisYear: number): Promise<StudentFillAuxMaps> {
  const enrolledYear = sourceYearForAnalysisYear(analysisYear, "enrolled");
  const rosterYear = sourceYearForAnalysisYear(analysisYear, "enrolled-students");
  const dropoutYear = sourceYearForAnalysisYear(analysisYear, "dropout");
  const foreignYear = sourceYearForAnalysisYear(analysisYear, "foreign");
  const foreignDropoutYear = sourceYearForAnalysisYear(analysisYear, "foreign-dropout");

  const [index, enrolledMapped, dropoutMapped, foreignMapped, foreignDropoutMapped, rosterMapped] =
    await Promise.all([
      loadSchoolCampusIndex(),
      loadCsvYearMapped<SlimEnrolled>({
        csvKey: "univMapEnrolledEnrollmentUndergrad",
        cacheKey: "studentFill:enrolled",
        yearOf: alimiYearOf,
        year: enrolledYear,
        mapRow: (raw) => {
          if (!eligible(raw)) return null;
          const parsed = parseAlimiEnrolledUndergradRow(raw);
          if (!parsed) return null;
          const half = parsed.half.trim();
          if (half !== "상반기" && half !== "하반기") return null;
          return {
            half,
            schoolCodeStd: parsed.schoolCodeStd,
            schoolName: raw.school_name ?? "",
            studentQuota: parsed.studentQuota,
            recruitmentStop: parsed.recruitmentStop,
            enrolledFill: parsed.enrolled.total,
            enrolledFillWithin: parsed.enrolled.within,
            enrolledFillOutside: parsed.enrolled.outside,
          };
        },
      }),
      loadCsvYearMapped<SlimDropout>({
        csvKey: "univMapDropoutRateUndergrad",
        cacheKey: "studentFill:dropout",
        yearOf: alimiYearOf,
        year: dropoutYear,
        mapRow: (raw) => {
          if (!eligible(raw)) return null;
          const parsed = parseAlimiDropoutUndergradRow(raw);
          if (!parsed) return null;
          return {
            schoolCodeStd: parsed.schoolCodeStd,
            schoolName: raw.school_name ?? "",
            enrolledStudents: parsed.enrolled.students,
            dropouts: parsed.enrolled.dropouts,
            freshmanStudents: parsed.freshman.students,
            freshmanDropouts: parsed.freshman.dropouts,
          };
        },
      }),
      loadCsvYearMapped({
        csvKey: "univMapForeignStudentsUndergrad",
        cacheKey: "studentFill:foreign",
        yearOf: alimiYearOf,
        year: foreignYear,
        mapRow: parseForeignStudents,
      }),
      loadCsvYearMapped({
        csvKey: "univMapForeignDropoutUndergrad",
        cacheKey: "studentFill:foreignDropout",
        yearOf: alimiYearOf,
        year: foreignDropoutYear,
        mapRow: parseForeignDropout,
      }),
      loadCsvYearMapped({
        csvKey: "univMapEnrolledStudentsUndergrad",
        cacheKey: "studentFill:roster",
        yearOf: alimiYearOf,
        year: rosterYear,
        mapRow: parseRoster,
      }),
    ]);

  const enrolledByHalf = new Map<string, Map<string, EnrolledFillRep>>();
  for (const parsed of enrolledMapped.rows) {
    const code = repCode(index, enrolledYear, parsed.schoolCodeStd, parsed.schoolName);
    let slice = enrolledByHalf.get(parsed.half);
    if (!slice) {
      slice = new Map();
      enrolledByHalf.set(parsed.half, slice);
    }
    addNum(slice, code, {
      studentQuota: parsed.studentQuota,
      recruitmentStop: parsed.recruitmentStop,
      enrolledFill: parsed.enrolledFill,
      enrolledFillWithin: parsed.enrolledFillWithin,
      enrolledFillOutside: parsed.enrolledFillOutside,
    });
  }
  const enrolled = mergePreferredEnrolledHalf(enrolledByHalf);

  const dropout = new Map<string, DropoutRep>();
  for (const parsed of dropoutMapped.rows) {
    const code = repCode(index, dropoutYear, parsed.schoolCodeStd, parsed.schoolName);
    addNum(dropout, code, {
      enrolledStudents: parsed.enrolledStudents,
      dropouts: parsed.dropouts,
      freshmanStudents: parsed.freshmanStudents,
      freshmanDropouts: parsed.freshmanDropouts,
    });
  }

  const foreign = new Map<string, ForeignRep>();
  for (const parsed of foreignMapped.rows) {
    if (!parsed) continue;
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
  for (const parsed of foreignDropoutMapped.rows) {
    const code = repCode(index, foreignDropoutYear, parsed.schoolCodeStd, parsed.schoolName);
    addNum(foreignDropout, code, {
      degreeEnrolled: parsed.degreeEnrolled,
      degreeDropouts: parsed.degreeDropouts,
      totalEnrolled: parsed.totalEnrolled,
      totalDropouts: parsed.totalDropouts,
    });
  }

  const roster = new Map<string, RosterRep>();
  for (const parsed of rosterMapped.rows) {
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
    auxOrder.push(analysisYear);
    while (auxOrder.length > AUX_CACHE_MAX) {
      const evictYear = auxOrder.shift();
      if (evictYear != null && evictYear !== analysisYear) {
        auxCache.delete(evictYear);
      }
    }
  } else {
    const idx = auxOrder.indexOf(analysisYear);
    if (idx >= 0) auxOrder.splice(idx, 1);
    auxOrder.push(analysisYear);
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
