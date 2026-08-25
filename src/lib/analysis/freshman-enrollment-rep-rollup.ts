import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";
import { isJuniorSchoolDivision } from "@/lib/analysis/all-universities-cohort";
import type { FreshmanEnrollmentRow } from "@/lib/ingest/freshman-enrollment-config";

export type FreshmanRepCohort =
  | "university"
  | "junior-college"
  | "graduate"
  | "combined";

export type FreshmanRepViewCohort = FreshmanRepCohort | "all-universities";

export const FRESHMAN_REP_COHORT_LABEL: Record<FreshmanRepCohort, string> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
  combined: "대학통합",
};

export const FRESHMAN_REP_VIEW_COHORT_LABEL: Record<
  FreshmanRepViewCohort,
  string
> = {
  ...FRESHMAN_REP_COHORT_LABEL,
  "all-universities": "전체대학",
};

export const FRESHMAN_REP_VIEW_COHORTS: FreshmanRepViewCohort[] = [
  "university",
  "graduate",
  "combined",
  "junior-college",
  "all-universities",
];

export const FRESHMAN_REP_COHORT_DIVISION: Record<
  Exclude<FreshmanRepCohort, "combined">,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
};

export type FreshmanRepCounts = {
  admissionQuota: number;
  recruit: { total: number; within: number; outside: number };
  enrolled: { total: number; within: number; outside: number };
};

export type FreshmanRepRow = FreshmanRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  gradProgramCount: number;
  gradAdmissionQuota: number;
  fillRateWithin: number | null;
  fillRateWithinOutside: number | null;
  hasAlimi: boolean;
};

export type FreshmanRepCompareField =
  | "admissionQuota"
  | "recruitTotal"
  | "recruitWithin"
  | "recruitOutside"
  | "enrolledTotal"
  | "enrolledWithin"
  | "enrolledOutside"
  | "fillRateWithin"
  | "fillRateWithinOutside";

export type FreshmanRepMismatch = {
  schoolRepName: string;
  schoolRepCode: string;
  field: FreshmanRepCompareField;
  mock: number | null;
  current: number | null;
};

export type FreshmanRepVerifyRow = {
  schoolRepName: string;
  schoolRepCode: string;
  status: "match" | "mismatch" | "mock-only" | "current-only";
  mismatches: FreshmanRepMismatch[];
};

export type FreshmanRepVerifySummary = {
  match: number;
  mismatch: number;
  mockOnly: number;
  currentOnly: number;
  rows: FreshmanRepVerifyRow[];
};

export type AnalysisTargetCampus = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolRepCode: string;
  schoolRepName: string;
  schoolDivision: string;
  mainBranchName: string;
  estb: string;
  region: string;
};

export type AlimiUndergradMetric = FreshmanRepCounts & {
  year: number;
  schoolCodeStd: string;
};

export type AlimiGradMetric = {
  year: number;
  schoolCodeStd: string;
  schoolRepName: string;
  programName: string;
  admissionQuota: number;
  enrolled: { total: number; within: number; outside: number };
};

export type ConsolidatedCompareRow = FreshmanRepCounts & {
  year: number;
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

export function normalizeSchoolCodeText(value: string): string {
  const text = value.trim();
  if (!text) return "";
  if (/^\d+$/.test(text) && text.length < 7) return text.padStart(7, "0");
  return text;
}

export function parseYearText(value: string): number | null {
  const m = value.match(/(\d{4})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1900 ? n : null;
}

export function roundRate1(enrolled: number, denom: number): number | null {
  if (!denom) return null;
  return Math.round((enrolled / denom) * 1000) / 10;
}

export function normalizeRepName(value: string): string {
  return value.replace(/[\s()[\]_·ㆍ]/g, "").toLowerCase();
}

export function pickNearestYear(
  available: number[],
  displayYear: number,
): number | null {
  if (!available.length) return null;
  if (available.includes(displayYear)) return displayYear;
  const prior = available.filter((y) => y <= displayYear);
  if (prior.length) return Math.max(...prior);
  return Math.min(...available);
}

export function parseAnalysisTargetCampus(
  raw: Record<string, string>,
): AnalysisTargetCampus | null {
  const year = parseYearText(raw.year ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  const schoolName = raw.school_name?.trim() ?? "";
  if (!year || !schoolCodeStd || !schoolName) return null;
  return {
    year,
    schoolCodeStd,
    schoolName,
    schoolRepCode: normalizeSchoolCodeText(raw.school_rep_code ?? "") || schoolCodeStd,
    schoolRepName: raw.school_rep_name?.trim() || schoolName,
    schoolDivision: raw.school_division?.trim() ?? "",
    mainBranchName: raw.main_branch_name?.trim() ?? "",
    estb: raw.estb?.trim() ?? "",
    region: raw.region?.trim() ?? "",
  };
}

function parseCellsJson(raw: string | undefined): string[] {
  try {
    const cells = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(cells) ? cells.map((c) => String(c ?? "")) : [];
  } catch {
    return [];
  }
}

export function parseAlimiUndergradRow(
  raw: Record<string, string>,
): AlimiUndergradMetric | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    admissionQuota: parseNum(cells[7]),
    recruit: {
      total: parseNum(cells[8]),
      within: parseNum(cells[9]),
      outside: parseNum(cells[10]),
    },
    enrolled: {
      total: parseNum(cells[14]),
      within: parseNum(cells[15]) + parseNum(cells[16]),
      outside: parseNum(cells[17]) + parseNum(cells[18]),
    },
  };
}

export function parseAlimiGradRow(
  raw: Record<string, string>,
): AlimiGradMetric | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolRepName: cells[2]?.trim() ?? "",
    programName: cells[8]?.trim() ?? "",
    admissionQuota: parseNum(cells[9]),
    enrolled: {
      total: parseNum(cells[15]),
      within: parseNum(cells[16]) + parseNum(cells[17]),
      outside: parseNum(cells[18]) + parseNum(cells[19]),
    },
  };
}

export function parseConsolidatedCompareRow(
  raw: Record<string, string>,
): ConsolidatedCompareRow | null {
  const year = parseYearText(raw.year ?? "");
  const schoolRepCode = normalizeSchoolCodeText(raw.school_rep_code ?? "");
  const schoolRepName = raw.school_rep_name?.trim() ?? "";
  if (!year || !schoolRepName) return null;
  const within = raw.fill_rate_within?.trim();
  const total = raw.fill_rate_within_outside?.trim();
  return {
    year,
    schoolRepCode,
    schoolRepName,
    schoolKind: raw.school_kind?.trim() ?? "",
    schoolDivision: raw.school_division?.trim() ?? "",
    admissionQuota: parseNum(raw.admission_quota),
    recruit: {
      total: parseNum(raw.recruit_total),
      within: parseNum(raw.recruit_within),
      outside: parseNum(raw.recruit_outside),
    },
    enrolled: {
      total: parseNum(raw.enrolled_total),
      within: parseNum(raw.enrolled_within),
      outside: parseNum(raw.enrolled_outside),
    },
    fillRateWithin: within ? parseNum(within) : null,
    fillRateWithinOutside: total ? parseNum(total) : null,
  };
}

function emptyCounts(): FreshmanRepCounts {
  return {
    admissionQuota: 0,
    recruit: { total: 0, within: 0, outside: 0 },
    enrolled: { total: 0, within: 0, outside: 0 },
  };
}

function addCounts(a: FreshmanRepCounts, b: FreshmanRepCounts): FreshmanRepCounts {
  return {
    admissionQuota: a.admissionQuota + b.admissionQuota,
    recruit: {
      total: a.recruit.total + b.recruit.total,
      within: a.recruit.within + b.recruit.within,
      outside: a.recruit.outside + b.recruit.outside,
    },
    enrolled: {
      total: a.enrolled.total + b.enrolled.total,
      within: a.enrolled.within + b.enrolled.within,
      outside: a.enrolled.outside + b.enrolled.outside,
    },
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

export function groupAnalysisTargetByRep(
  campuses: AnalysisTargetCampus[],
  division: string,
): Map<string, AnalysisTargetCampus[]> {
  const groups = new Map<string, AnalysisTargetCampus[]>();
  for (const row of campuses) {
    if (row.schoolDivision !== division) continue;
    const key = row.schoolRepCode || row.schoolCodeStd;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function applyRates(
  counts: FreshmanRepCounts,
  cohort: FreshmanRepCohort,
  gradQuota: number,
): { within: number | null; withinOutside: number | null } {
  if (cohort === "graduate") {
    return {
      within: roundRate1(counts.enrolled.within, counts.admissionQuota),
      withinOutside: roundRate1(counts.enrolled.total, counts.admissionQuota),
    };
  }
  if (cohort === "combined") {
    return {
      within: roundRate1(
        counts.enrolled.within,
        counts.recruit.within + gradQuota,
      ),
      withinOutside: roundRate1(
        counts.enrolled.total,
        counts.recruit.total + gradQuota,
      ),
    };
  }
  return {
    within: roundRate1(counts.enrolled.within, counts.recruit.within),
    withinOutside: roundRate1(counts.enrolled.total, counts.recruit.total),
  };
}

export function buildFreshmanRepRows(args: {
  cohort: FreshmanRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  undergrad: AlimiUndergradMetric[];
  grad: AlimiGradMetric[];
}): FreshmanRepRow[] {
  const { cohort, displayYear, roster, undergrad, grad } = args;
  const ugByCode = new Map<string, AlimiUndergradMetric>();
  for (const row of undergrad) {
    if (row.year !== displayYear) continue;
    ugByCode.set(row.schoolCodeStd, row);
  }
  const grByCode = new Map<string, AlimiGradMetric[]>();
  const grByRepName = new Map<string, AlimiGradMetric[]>();
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

  const rows: FreshmanRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    let gradProgramCount = 0;
    let gradQuota = 0;

    if (cohort !== "graduate") {
      for (const campus of campuses) {
        const ug = ugByCode.get(campus.schoolCodeStd);
        if (!ug) continue;
        campusHit += 1;
        counts = addCounts(counts, ug);
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
      const addProgram = (program: AlimiGradMetric) => {
        const key = `${program.schoolCodeStd}::${program.programName}::${program.admissionQuota}`;
        if (usedPrograms.has(key)) return;
        usedPrograms.add(key);
        gradProgramCount += 1;
        gradQuota += program.admissionQuota;
        counts = addCounts(counts, {
          admissionQuota: program.admissionQuota,
          recruit: { total: 0, within: 0, outside: 0 },
          enrolled: program.enrolled,
        });
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

    const rates = applyRates(counts, cohort, gradQuota);
    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision:
        cohort === "combined"
          ? "대학"
          : FRESHMAN_REP_COHORT_DIVISION[
              cohort === "junior-college" ? "junior-college" : cohort === "graduate" ? "graduate" : "university"
            ],
      campusCount: campuses.length,
      gradProgramCount,
      gradAdmissionQuota: gradQuota,
      ...counts,
      fillRateWithin: rates.within,
      fillRateWithinOutside: rates.withinOutside,
      hasAlimi:
        cohort === "graduate" ? gradProgramCount > 0 : campusHit > 0 || gradProgramCount > 0,
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

function sameInt(a: number, b: number): boolean {
  return a === b;
}

function sameRate(a: number | null, b: number | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= 0.1 + 1e-9;
}

export function verifyAgainstConsolidated(
  mockRows: FreshmanRepRow[],
  currentRows: ConsolidatedCompareRow[],
  cohort: "university" | "junior-college",
): FreshmanRepVerifySummary {
  const wantDiv = FRESHMAN_REP_COHORT_DIVISION[cohort];
  const current = currentRows.filter((row) => {
    const div =
      resolveSchoolDivisionFromFields(row.schoolKind, row.schoolDivision) ??
      row.schoolDivision;
    return div === wantDiv;
  });

  const currentByName = new Map<string, ConsolidatedCompareRow>();
  const currentByCode = new Map<string, ConsolidatedCompareRow>();
  for (const row of current) {
    currentByName.set(normalizeRepName(row.schoolRepName), row);
    if (row.schoolRepCode) currentByCode.set(row.schoolRepCode, row);
  }

  const used = new Set<ConsolidatedCompareRow>();
  const verifyRows: FreshmanRepVerifyRow[] = [];

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
    const mismatches: FreshmanRepMismatch[] = [];
    const checks: [FreshmanRepCompareField, number | null, number | null, "int" | "rate"][] =
      [
        ["admissionQuota", mock.admissionQuota, hit.admissionQuota, "int"],
        ["recruitTotal", mock.recruit.total, hit.recruit.total, "int"],
        ["recruitWithin", mock.recruit.within, hit.recruit.within, "int"],
        ["recruitOutside", mock.recruit.outside, hit.recruit.outside, "int"],
        ["enrolledTotal", mock.enrolled.total, hit.enrolled.total, "int"],
        ["enrolledWithin", mock.enrolled.within, hit.enrolled.within, "int"],
        ["enrolledOutside", mock.enrolled.outside, hit.enrolled.outside, "int"],
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
        kind === "int"
          ? sameInt(mockVal ?? 0, currentVal ?? 0)
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

  for (const row of current) {
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

export function sumCohortRates(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepViewCohort,
) {
  return sumRatesForRows(rows, cohort);
}

export type FreshmanRepStatPoint = {
  label: string;
  fillRateWithin: number | null;
  fillRateWithinOutside: number | null;
  schoolCount: number;
};

export function buildRegionStats(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepCohort,
): FreshmanRepStatPoint[] {
  const groups = new Map<string, FreshmanRepRow[]>();
  for (const row of rows) {
    const key = row.region || "(미상)";
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return [...groups.entries()]
    .map(([label, list]) => ({
      label,
      schoolCount: list.length,
      ...sumRatesForRows(list, cohort),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

export function buildEstbStats(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepCohort,
): FreshmanRepStatPoint[] {
  const groups = new Map<string, FreshmanRepRow[]>();
  for (const row of rows) {
    const key = row.estb || "(미상)";
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return [...groups.entries()]
    .map(([label, list]) => ({
      label,
      schoolCount: list.length,
      ...sumRatesForRows(list, cohort),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

/** 통계분석 차트용 — 합산 분모를 recruit에 넣어 기존 신입생충원 차트와 동일하게 재계산 */
export function toRepFreshmanEnrollmentRows(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepCohort,
): FreshmanEnrollmentRow[] {
  return rows.map((row) => {
    const recruitWithin =
      cohort === "combined"
        ? row.recruit.within + row.gradAdmissionQuota
        : cohort === "graduate"
          ? row.admissionQuota
          : row.recruit.within;
    const recruitTotal =
      cohort === "combined"
        ? row.recruit.total + row.gradAdmissionQuota
        : cohort === "graduate"
          ? row.admissionQuota
          : row.recruit.total;
    return {
      year: row.year,
      schoolKind: isJuniorSchoolDivision(row.schoolDivision)
        ? "전문대학"
        : "대학",
      estb: row.estb,
      schoolDivision: row.schoolDivision,
      region: row.region,
      schoolCodeStd: row.schoolRepCode,
      schoolName: row.schoolRepName,
      admissionQuota: row.admissionQuota,
      recruit: {
        total: recruitTotal,
        within: recruitWithin,
        outside: row.recruit.outside,
      },
      enrolled: row.enrolled,
      fillRate: {
        within: row.fillRateWithin ?? 0,
        withinOutside: row.fillRateWithinOutside ?? 0,
      },
    };
  });
}

export function freshmanRateCohortForRow(
  row: FreshmanRepRow,
  view: FreshmanRepViewCohort,
): FreshmanRepCohort {
  if (view !== "all-universities") return view;
  return isJuniorSchoolDivision(row.schoolDivision)
    ? "junior-college"
    : "combined";
}

export function toRepFreshmanEnrollmentRowsForView(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepViewCohort,
): FreshmanEnrollmentRow[] {
  if (cohort !== "all-universities") {
    return toRepFreshmanEnrollmentRows(rows, cohort);
  }
  return rows.flatMap((row) =>
    toRepFreshmanEnrollmentRows([row], freshmanRateCohortForRow(row, cohort)),
  );
}

function sumRatesForRows(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepViewCohort,
): { fillRateWithin: number | null; fillRateWithinOutside: number | null } {
  let enrolledWithin = 0;
  let enrolledTotal = 0;
  let denomWithin = 0;
  let denomTotal = 0;
  for (const row of rows) {
    enrolledWithin += row.enrolled.within;
    enrolledTotal += row.enrolled.total;
    const rateCohort = freshmanRateCohortForRow(row, cohort);
    if (rateCohort === "graduate") {
      denomWithin += row.admissionQuota;
      denomTotal += row.admissionQuota;
    } else if (rateCohort === "combined") {
      denomWithin += row.recruit.within + row.gradAdmissionQuota;
      denomTotal += row.recruit.total + row.gradAdmissionQuota;
    } else {
      denomWithin += row.recruit.within;
      denomTotal += row.recruit.total;
    }
  }
  return {
    fillRateWithin: roundRate1(enrolledWithin, denomWithin),
    fillRateWithinOutside: roundRate1(enrolledTotal, denomTotal),
  };
}
