import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import type { EnrolledEnrollmentRow } from "@/lib/ingest/enrolled-enrollment-config";
import {
  groupAnalysisTargetByRep,
  normalizeRepName,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
  type FreshmanRepCohort,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";
import {
  studentFillSchoolKind,
  type StudentFillViewCohort,
} from "@/lib/analysis/all-universities-cohort";

export type EnrolledRepCohort = FreshmanRepCohort;
export type EnrolledRepViewCohort = StudentFillViewCohort;

export const ENROLLED_REP_COHORT_LABEL: Record<EnrolledRepCohort, string> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
  combined: "대학통합",
};

export const ENROLLED_REP_VIEW_COHORT_LABEL: Record<
  EnrolledRepViewCohort,
  string
> = {
  ...ENROLLED_REP_COHORT_LABEL,
  "all-universities": "전체대학",
};

export const ENROLLED_REP_COHORT_DIVISION: Record<
  Exclude<EnrolledRepCohort, "combined">,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
};

export const ENROLLED_REP_HALVES = ["상반기", "하반기"] as const;
export type EnrolledRepHalf = (typeof ENROLLED_REP_HALVES)[number];

export type EnrolledRepCounts = {
  studentQuota: number;
  recruitmentStop: number;
  enrolled: { total: number; within: number; outside: number };
};

export type EnrolledRepRow = EnrolledRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  gradProgramCount: number;
  fillRateWithin: number | null;
  fillRateWithinOutside: number | null;
  hasAlimi: boolean;
};

export type EnrolledRepCompareField =
  | "studentQuota"
  | "recruitmentStop"
  | "enrolledTotal"
  | "enrolledWithin"
  | "enrolledOutside"
  | "fillRateWithin"
  | "fillRateWithinOutside";

export type EnrolledRepMismatch = {
  schoolRepName: string;
  schoolRepCode: string;
  field: EnrolledRepCompareField;
  mock: number | null;
  current: number | null;
};

export type EnrolledRepVerifyRow = {
  schoolRepName: string;
  schoolRepCode: string;
  status: "match" | "mismatch" | "mock-only" | "current-only";
  mismatches: EnrolledRepMismatch[];
};

export type EnrolledRepVerifySummary = {
  match: number;
  mismatch: number;
  mockOnly: number;
  currentOnly: number;
  rows: EnrolledRepVerifyRow[];
};

export type AlimiEnrolledUndergrad = EnrolledRepCounts & {
  year: number;
  half: string;
  schoolCodeStd: string;
};

export type AlimiEnrolledGrad = EnrolledRepCounts & {
  year: number;
  schoolCodeStd: string;
  schoolRepName: string;
  programName: string;
};

export type EnrolledConsolidatedCompare = EnrolledRepCounts & {
  year: number;
  half: string;
  schoolRepCode: string;
  schoolRepName: string;
  schoolKind: string;
  schoolDivision: string;
  fillRateWithin: number | null;
  fillRateWithinOutside: number | null;
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

export function parseAlimiEnrolledUndergradRow(
  raw: Record<string, string>,
): AlimiEnrolledUndergrad | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  const half = (cells[1] ?? "").trim();
  if (!half) return null;
  return {
    year,
    half,
    schoolCodeStd,
    studentQuota: parseNum(cells[8]),
    recruitmentStop: parseNum(cells[9]),
    enrolled: {
      total: parseNum(cells[10]),
      within: parseNum(cells[11]),
      outside: parseNum(cells[12]),
    },
  };
}

export function parseAlimiEnrolledGradRow(
  raw: Record<string, string>,
): AlimiEnrolledGrad | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolRepName: cells[2]?.trim() ?? "",
    programName: cells[8]?.trim() ?? "",
    studentQuota: parseNum(cells[9]),
    recruitmentStop: parseNum(cells[10]),
    enrolled: {
      total: parseNum(cells[11]),
      within: parseNum(cells[12]) + parseNum(cells[13]) + parseNum(cells[14]),
      outside: parseNum(cells[15]) + parseNum(cells[16]) + parseNum(cells[17]),
    },
  };
}

export function parseEnrolledConsolidatedCompareRow(
  raw: Record<string, string>,
): EnrolledConsolidatedCompare | null {
  const year = parseYearText(raw.year ?? "");
  const schoolRepCode = normalizeSchoolCodeText(raw.school_rep_code ?? "");
  const schoolRepName = raw.school_rep_name?.trim() ?? "";
  const half = raw.half?.trim() ?? "";
  if (!year || !schoolRepName || !half) return null;
  const within = raw.fill_rate_within?.trim();
  const total = raw.fill_rate?.trim();
  return {
    year,
    half,
    schoolRepCode,
    schoolRepName,
    schoolKind: raw.school_kind?.trim() ?? "",
    schoolDivision: raw.school_division?.trim() ?? "",
    studentQuota: parseNum(raw.student_quota),
    recruitmentStop: parseNum(raw.recruitment_suspension),
    enrolled: {
      total: parseNum(raw.enrolled_total),
      within: parseNum(raw.enrolled_within),
      outside: parseNum(raw.enrolled_outside),
    },
    fillRateWithin: within ? parseNum(within) : null,
    fillRateWithinOutside: total ? parseNum(total) : null,
  };
}

function emptyCounts(): EnrolledRepCounts {
  return {
    studentQuota: 0,
    recruitmentStop: 0,
    enrolled: { total: 0, within: 0, outside: 0 },
  };
}

function addCounts(a: EnrolledRepCounts, b: EnrolledRepCounts): EnrolledRepCounts {
  return {
    studentQuota: a.studentQuota + b.studentQuota,
    recruitmentStop: a.recruitmentStop + b.recruitmentStop,
    enrolled: {
      total: a.enrolled.total + b.enrolled.total,
      within: a.enrolled.within + b.enrolled.within,
      outside: a.enrolled.outside + b.enrolled.outside,
    },
  };
}

export function averageCounts(items: EnrolledRepCounts[]): EnrolledRepCounts {
  if (!items.length) return emptyCounts();
  if (items.length === 1) return items[0]!;
  const sum = items.reduce(addCounts, emptyCounts());
  const n = items.length;
  return {
    studentQuota: sum.studentQuota / n,
    recruitmentStop: sum.recruitmentStop / n,
    enrolled: {
      total: sum.enrolled.total / n,
      within: sum.enrolled.within / n,
      outside: sum.enrolled.outside / n,
    },
  };
}

function undergradPeriodKey(
  year: number,
  schoolCodeStd: string,
  half: string,
): string {
  return `${year}::${schoolCodeStd}::${half}`;
}

function rollupUndergradPeriod(
  campuses: AnalysisTargetCampus[],
  ugByCode: Map<string, AlimiEnrolledUndergrad>,
  year: number,
  half: string,
): EnrolledRepCounts | null {
  let counts = emptyCounts();
  let hit = 0;
  for (const campus of campuses) {
    const ug = ugByCode.get(undergradPeriodKey(year, campus.schoolCodeStd, half));
    if (!ug) continue;
    hit += 1;
    counts = addCounts(counts, ug);
  }
  return hit ? counts : null;
}

/** 표시연도 상반기 + 전년도 하반기. 한쪽만 있으면 그 값만 씀 */
function averageUndergradForYear(
  campuses: AnalysisTargetCampus[],
  ugByCode: Map<string, AlimiEnrolledUndergrad>,
  displayYear: number,
): { counts: EnrolledRepCounts; campusHit: number } {
  const firstHalf = rollupUndergradPeriod(
    campuses,
    ugByCode,
    displayYear,
    "상반기",
  );
  const prevSecondHalf = rollupUndergradPeriod(
    campuses,
    ugByCode,
    displayYear - 1,
    "하반기",
  );
  const periods = [firstHalf, prevSecondHalf].filter(
    (row): row is EnrolledRepCounts => row != null,
  );
  const campusHit = new Set(
    campuses
      .filter(
        (campus) =>
          ugByCode.has(
            undergradPeriodKey(displayYear, campus.schoolCodeStd, "상반기"),
          ) ||
          ugByCode.has(
            undergradPeriodKey(displayYear - 1, campus.schoolCodeStd, "하반기"),
          ),
      )
      .map((campus) => campus.schoolCodeStd),
  ).size;
  return { counts: averageCounts(periods), campusHit };
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

export function effectiveQuota(counts: EnrolledRepCounts): number {
  return counts.studentQuota - counts.recruitmentStop;
}

function applyRates(counts: EnrolledRepCounts): {
  within: number | null;
  withinOutside: number | null;
} {
  const denom = effectiveQuota(counts);
  return {
    within: roundRate1(counts.enrolled.within, denom),
    withinOutside: roundRate1(counts.enrolled.total, denom),
  };
}

export function buildEnrolledRepRows(args: {
  cohort: EnrolledRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  undergrad: AlimiEnrolledUndergrad[];
  grad: AlimiEnrolledGrad[];
}): EnrolledRepRow[] {
  const { cohort, displayYear, roster, undergrad, grad } = args;
  const ugByCode = new Map<string, AlimiEnrolledUndergrad>();
  for (const row of undergrad) {
    ugByCode.set(
      undergradPeriodKey(row.year, row.schoolCodeStd, row.half),
      row,
    );
  }
  const grByCode = new Map<string, AlimiEnrolledGrad[]>();
  const grByRepName = new Map<string, AlimiEnrolledGrad[]>();
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

  const rows: EnrolledRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    let gradProgramCount = 0;

    if (cohort !== "graduate") {
      const ug = averageUndergradForYear(campuses, ugByCode, displayYear);
      campusHit = ug.campusHit;
      counts = addCounts(counts, ug.counts);
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
      const addProgram = (program: AlimiEnrolledGrad) => {
        const key = `${program.schoolCodeStd}::${program.programName}::${program.studentQuota}`;
        if (usedPrograms.has(key)) return;
        usedPrograms.add(key);
        gradProgramCount += 1;
        counts = addCounts(counts, program);
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

    const rates = applyRates(counts);
    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision:
        cohort === "combined"
          ? "대학"
          : ENROLLED_REP_COHORT_DIVISION[
              cohort === "junior-college"
                ? "junior-college"
                : cohort === "graduate"
                  ? "graduate"
                  : "university"
            ],
      campusCount: campuses.length,
      gradProgramCount,
      ...counts,
      fillRateWithin: rates.within,
      fillRateWithinOutside: rates.withinOutside,
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

function roundExistingRate(value: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 10) / 10;
}

function sameNumber(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-6;
}

function sameRate(a: number | null, b: number | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= 0.1 + 1e-9;
}

export function verifyEnrolledAgainstConsolidated(
  mockRows: EnrolledRepRow[],
  currentRows: EnrolledConsolidatedCompare[],
  cohort: "university" | "junior-college",
): EnrolledRepVerifySummary {
  const wantDiv = ENROLLED_REP_COHORT_DIVISION[cohort];
  const current = currentRows.filter((row) => {
    const div =
      resolveSchoolDivisionFromFields(row.schoolKind, row.schoolDivision) ??
      row.schoolDivision;
    return div === wantDiv;
  });

  const grouped = new Map<string, EnrolledConsolidatedCompare[]>();
  for (const row of current) {
    const key =
      normalizeRepName(row.schoolRepName) || row.schoolRepCode || row.schoolRepName;
    const list = grouped.get(key);
    if (list) list.push(row);
    else grouped.set(key, [row]);
  }

  const averagedCurrent: EnrolledConsolidatedCompare[] = [];
  for (const list of grouped.values()) {
    const primary = list[0]!;
    const counts = averageCounts(list);
    const rates = applyRates(counts);
    averagedCurrent.push({
      ...primary,
      ...counts,
      fillRateWithin: rates.within,
      fillRateWithinOutside: rates.withinOutside,
    });
  }

  const currentByName = new Map<string, EnrolledConsolidatedCompare>();
  const currentByCode = new Map<string, EnrolledConsolidatedCompare>();
  for (const row of averagedCurrent) {
    currentByName.set(normalizeRepName(row.schoolRepName), row);
    if (row.schoolRepCode) currentByCode.set(row.schoolRepCode, row);
  }

  const used = new Set<EnrolledConsolidatedCompare>();
  const verifyRows: EnrolledRepVerifyRow[] = [];

  for (const mock of mockRows) {
    const byName = currentByName.get(normalizeRepName(mock.schoolRepName));
    const byCode = currentByCode.get(mock.schoolRepCode);
    const hit = byName ?? byCode;
    if (!hit) {
      verifyRows.push({
        schoolRepName: mock.schoolRepName,
        schoolRepCode: mock.schoolRepCode,
        status: "mock-only",
        mismatches: [],
      });
      continue;
    }
    used.add(hit);
    const mismatches: EnrolledRepMismatch[] = [];
    const checks: [
      EnrolledRepCompareField,
      number | null,
      number | null,
      "num" | "rate",
    ][] = [
      ["studentQuota", mock.studentQuota, hit.studentQuota, "num"],
      ["recruitmentStop", mock.recruitmentStop, hit.recruitmentStop, "num"],
      ["enrolledTotal", mock.enrolled.total, hit.enrolled.total, "num"],
      ["enrolledWithin", mock.enrolled.within, hit.enrolled.within, "num"],
      ["enrolledOutside", mock.enrolled.outside, hit.enrolled.outside, "num"],
      [
        "fillRateWithin",
        mock.fillRateWithin,
        roundExistingRate(hit.fillRateWithin),
        "rate",
      ],
      [
        "fillRateWithinOutside",
        mock.fillRateWithinOutside,
        roundExistingRate(hit.fillRateWithinOutside),
        "rate",
      ],
    ];
    for (const [field, mockVal, currentVal, kind] of checks) {
      const ok =
        kind === "num"
          ? sameNumber(mockVal ?? 0, currentVal ?? 0)
          : sameRate(mockVal, currentVal);
      if (!ok) {
        mismatches.push({
          schoolRepName: mock.schoolRepName,
          schoolRepCode: mock.schoolRepCode,
          field,
          mock: mockVal,
          current: currentVal,
        });
      }
    }
    verifyRows.push({
      schoolRepName: mock.schoolRepName,
      schoolRepCode: mock.schoolRepCode,
      status: mismatches.length ? "mismatch" : "match",
      mismatches,
    });
  }

  for (const row of averagedCurrent) {
    if (used.has(row)) continue;
    verifyRows.push({
      schoolRepName: row.schoolRepName,
      schoolRepCode: row.schoolRepCode,
      status: "current-only",
      mismatches: [],
    });
  }

  return {
    match: verifyRows.filter((r) => r.status === "match").length,
    mismatch: verifyRows.filter((r) => r.status === "mismatch").length,
    mockOnly: verifyRows.filter((r) => r.status === "mock-only").length,
    currentOnly: verifyRows.filter((r) => r.status === "current-only").length,
    rows: verifyRows.sort((a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko"),
    ),
  };
}

export function sumEnrolledCohortRates(rows: EnrolledRepRow[]): {
  fillRateWithin: number | null;
  fillRateWithinOutside: number | null;
} {
  let enrolledWithin = 0;
  let enrolledTotal = 0;
  let denom = 0;
  for (const row of rows) {
    enrolledWithin += row.enrolled.within;
    enrolledTotal += row.enrolled.total;
    denom += effectiveQuota(row);
  }
  return {
    fillRateWithin: roundRate1(enrolledWithin, denom),
    fillRateWithinOutside: roundRate1(enrolledTotal, denom),
  };
}

export function toRepEnrolledEnrollmentRows(
  rows: EnrolledRepRow[],
): EnrolledEnrollmentRow[] {
  return rows.map((row) => ({
    year: row.year,
    half: "연평균",
    schoolKind: studentFillSchoolKind(row.schoolDivision),
    estb: row.estb,
    schoolDivision: row.schoolDivision,
    region: row.region,
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    studentQuota: row.studentQuota,
    recruitmentSuspension: row.recruitmentStop,
    enrolled: row.enrolled,
    fillRate: row.fillRateWithinOutside ?? 0,
    fillRateWithin: row.fillRateWithin ?? 0,
  }));
}

export function toRepEnrolledChartRows(
  rows: EnrolledRepRow[],
  metric: "within" | "withinOutside",
): CorpTransferRatioAdvancedRow[] {
  return rows.map((row) => {
    const quotaNet = Math.max(0, effectiveQuota(row));
    const isWithin = metric === "within";
    return {
      year: row.year,
      schoolCodeStd: row.schoolRepCode,
      schoolName: row.schoolRepName,
      schoolDivision: row.schoolDivision,
      schoolKind: studentFillSchoolKind(row.schoolDivision),
      region: row.region,
      estb: row.estb,
      ordinaryExpenseTransfer: row.studentQuota,
      tuitionRevenue: quotaNet,
      legalObligationTransfer: row.enrolled.total,
      assetTransfer: row.recruitmentStop,
      totalTransfer: isWithin ? row.enrolled.within : row.enrolled.total,
      transferRatio: isWithin
        ? (row.fillRateWithin ?? 0)
        : (row.fillRateWithinOutside ?? 0),
    };
  });
}
