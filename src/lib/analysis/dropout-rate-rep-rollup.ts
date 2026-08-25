import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import {
  groupAnalysisTargetByRep,
  normalizeRepName,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
  type FreshmanRepCohort,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

import {
  studentFillSchoolKind,
  type StudentFillViewCohort,
} from "@/lib/analysis/all-universities-cohort";

export type DropoutRepCohort = FreshmanRepCohort;
export type DropoutRepViewCohort = StudentFillViewCohort;

export const DROPOUT_REP_COHORT_LABEL: Record<DropoutRepCohort, string> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
  combined: "대학통합",
};

export const DROPOUT_REP_VIEW_COHORT_LABEL: Record<
  DropoutRepViewCohort,
  string
> = {
  ...DROPOUT_REP_COHORT_LABEL,
  "all-universities": "전체대학",
};

export const DROPOUT_REP_COHORT_DIVISION: Record<
  Exclude<DropoutRepCohort, "combined">,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
};

export type DropoutHeadcount = {
  students: number;
  dropouts: number;
};

export type DropoutRepRow = {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  gradProgramCount: number;
  enrolled: DropoutHeadcount & { rate: number | null };
  freshman: DropoutHeadcount & { rate: number | null };
  hasAlimi: boolean;
};

export type AlimiDropoutUndergrad = {
  year: number;
  schoolCodeStd: string;
  enrolled: DropoutHeadcount;
  freshman: DropoutHeadcount;
};

export type AlimiDropoutGrad = {
  year: number;
  schoolCodeStd: string;
  schoolRepName: string;
  programName: string;
  enrolled: DropoutHeadcount;
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

export function parseAlimiDropoutUndergradRow(
  raw: Record<string, string>,
): AlimiDropoutUndergrad | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    enrolled: {
      students: parseNum(cells[7]),
      dropouts: parseNum(cells[8]),
    },
    freshman: {
      students: parseNum(cells[18]),
      dropouts: parseNum(cells[19]),
    },
  };
}

export function parseAlimiDropoutGradRow(
  raw: Record<string, string>,
): AlimiDropoutGrad | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolRepName: cells[2]?.trim() ?? "",
    programName: `${cells[8]?.trim() ?? ""}::${cells[9]?.trim() ?? ""}`,
    enrolled: {
      students: parseNum(cells[10]),
      dropouts: parseNum(cells[11]),
    },
  };
}

function emptyHeadcount(): DropoutHeadcount {
  return { students: 0, dropouts: 0 };
}

function addHeadcount(a: DropoutHeadcount, b: DropoutHeadcount): DropoutHeadcount {
  return {
    students: a.students + b.students,
    dropouts: a.dropouts + b.dropouts,
  };
}

function withRate(counts: DropoutHeadcount) {
  return {
    ...counts,
    rate: roundRate1(counts.dropouts, counts.students),
  };
}

function pickPrimaryCampus(rows: AnalysisTargetCampus[]): AnalysisTargetCampus {
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

export function buildDropoutRepRows(args: {
  cohort: DropoutRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  undergrad: AlimiDropoutUndergrad[];
  grad: AlimiDropoutGrad[];
}): DropoutRepRow[] {
  const { cohort, displayYear, roster, undergrad, grad } = args;
  const ugByCode = new Map<string, AlimiDropoutUndergrad>();
  for (const row of undergrad) {
    if (row.year !== displayYear) continue;
    ugByCode.set(row.schoolCodeStd, row);
  }
  const grByCode = new Map<string, AlimiDropoutGrad[]>();
  const grByRepName = new Map<string, AlimiDropoutGrad[]>();
  for (const row of grad) {
    if (row.year !== displayYear) continue;
    const byCode = grByCode.get(row.schoolCodeStd);
    if (byCode) byCode.push(row);
    else grByCode.set(row.schoolCodeStd, [row]);
    const nameKey = normalizeRepName(row.schoolRepName);
    if (!nameKey) continue;
    const byName = grByRepName.get(nameKey);
    if (byName) byName.push(row);
    else grByRepName.set(nameKey, [row]);
  }

  const univGroups = groupAnalysisTargetByRep(roster, "대학");
  const jcGroups = groupAnalysisTargetByRep(roster, "전문대학");
  const gradGroups = groupAnalysisTargetByRep(roster, "대학원");

  const targetGroups =
    cohort === "junior-college"
      ? jcGroups
      : cohort === "graduate"
        ? gradGroups
        : univGroups;

  const rows: DropoutRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let enrolled = emptyHeadcount();
    let freshman = emptyHeadcount();
    let campusHit = 0;
    let gradProgramCount = 0;

    if (cohort !== "graduate") {
      for (const campus of campuses) {
        const ug = ugByCode.get(campus.schoolCodeStd);
        if (!ug) continue;
        campusHit += 1;
        enrolled = addHeadcount(enrolled, ug.enrolled);
        freshman = addHeadcount(freshman, ug.freshman);
      }
    }

    if (cohort === "graduate" || cohort === "combined") {
      const lookupCodes = new Set<string>();
      for (const campus of campuses) lookupCodes.add(campus.schoolCodeStd);
      for (const campus of univGroups.get(repCode) ?? []) {
        lookupCodes.add(campus.schoolCodeStd);
      }
      for (const campus of gradGroups.get(repCode) ?? []) {
        lookupCodes.add(campus.schoolCodeStd);
      }

      const usedPrograms = new Set<string>();
      const addProgram = (program: AlimiDropoutGrad) => {
        const key = `${program.schoolCodeStd}::${program.programName}::${program.enrolled.students}`;
        if (usedPrograms.has(key)) return;
        usedPrograms.add(key);
        gradProgramCount += 1;
        enrolled = addHeadcount(enrolled, program.enrolled);
      };

      for (const code of lookupCodes) {
        for (const program of grByCode.get(code) ?? []) addProgram(program);
      }
      if (gradProgramCount === 0) {
        for (const program of grByRepName.get(
          normalizeRepName(primary.schoolRepName),
        ) ?? []) {
          addProgram(program);
        }
      }
    }

    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision:
        cohort === "combined"
          ? "대학"
          : DROPOUT_REP_COHORT_DIVISION[
              cohort === "junior-college"
                ? "junior-college"
                : cohort === "graduate"
                  ? "graduate"
                  : "university"
            ],
      campusCount: campuses.length,
      gradProgramCount,
      enrolled: withRate(enrolled),
      freshman: withRate(freshman),
      hasAlimi:
        cohort === "graduate"
          ? gradProgramCount > 0
          : campusHit > 0 || gradProgramCount > 0,
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

export function sumDropoutCohortRates(rows: DropoutRepRow[]): {
  enrolledRate: number | null;
  freshmanRate: number | null;
} {
  let enrolledStudents = 0;
  let enrolledDropouts = 0;
  let freshmanStudents = 0;
  let freshmanDropouts = 0;
  for (const row of rows) {
    enrolledStudents += row.enrolled.students;
    enrolledDropouts += row.enrolled.dropouts;
    freshmanStudents += row.freshman.students;
    freshmanDropouts += row.freshman.dropouts;
  }
  return {
    enrolledRate: roundRate1(enrolledDropouts, enrolledStudents),
    freshmanRate: roundRate1(freshmanDropouts, freshmanStudents),
  };
}

export function toRepDropoutChartRows(
  rows: DropoutRepRow[],
  metric: "enrolled" | "freshman",
): CorpTransferRatioAdvancedRow[] {
  return rows.map((row) => {
    const bucket = metric === "freshman" ? row.freshman : row.enrolled;
    return {
      year: row.year,
      schoolCodeStd: row.schoolRepCode,
      schoolName: row.schoolRepName,
      schoolDivision: row.schoolDivision,
      schoolKind: studentFillSchoolKind(row.schoolDivision),
      region: row.region,
      estb: row.estb,
      tuitionRevenue: bucket.students,
      ordinaryExpenseTransfer: bucket.students,
      legalObligationTransfer: bucket.dropouts,
      assetTransfer: 0,
      totalTransfer: bucket.dropouts,
      transferRatio: bucket.rate ?? 0,
    };
  });
}
