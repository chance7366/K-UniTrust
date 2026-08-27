import { parseAlimiEnrolledStudentsUndergrad } from "@/lib/analysis/enrolled-students-rep-count";
import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { readCsvFile } from "@/lib/csv/read";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import {
  loadSchoolCampusIndex,
  MAIN_BRANCH_LABEL,
  padSchoolCode,
  type SchoolCampusIndex,
} from "@/lib/ingest/school-code-campus-index";

import {
  isStudentFillEligibleCampus,
  studentFillDivisionFromKind,
} from "./cohort-rules";
import {
  metroFromRegion,
  pct,
  type StudentFillNationalYear,
  type StudentFillSchoolRow,
} from "./types";

type CampusMetric = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolKind: string;
  estb: string;
  status: string;
  region: string;
  recruitWithin: number;
  recruitOutside: number;
  recruitTotal: number;
  admitWithin: number;
  admitOutside: number;
  admitTotal: number;
  storedRateIn: number;
  storedRateAll: number;
};

function num(v: string | undefined): number {
  if (v == null || v.trim() === "") return 0;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function yearOf(v: string | undefined): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 2000 && n <= 2100 ? n : null;
}

function parseCampus(row: Record<string, string>): CampusMetric | null {
  const year = yearOf(row.year);
  const schoolCodeStd = padSchoolCode(row.school_code_std ?? "");
  const schoolName = (row.school_name ?? "").trim();
  const schoolKind = (row.school_kind ?? "").trim();
  const estb = (row.estb ?? "").trim();
  const status = (row.status ?? "").trim();
  if (!year || !schoolCodeStd || !schoolName) return null;
  if (!isStudentFillEligibleCampus({ estb, schoolKind, status })) return null;
  if (!studentFillDivisionFromKind(schoolKind)) return null;

  const recruitWithin = num(row.recruit_within);
  const recruitOutside = num(row.recruit_outside);
  const recruitTotal = num(row.recruit_total) || recruitWithin + recruitOutside;
  const admitWithin = num(row.enrolled_within);
  const admitOutside = num(row.enrolled_outside);
  const admitTotal = num(row.enrolled_total) || admitWithin + admitOutside;

  return {
    year,
    schoolCodeStd,
    schoolName,
    schoolKind,
    estb,
    status,
    region: (row.region ?? "").trim(),
    recruitWithin,
    recruitOutside,
    recruitTotal,
    admitWithin,
    admitOutside,
    admitTotal,
    storedRateIn: num(row.fill_rate_within),
    storedRateAll: num(row.fill_rate_within_outside),
  };
}

function identity(
  campus: CampusMetric,
  index: SchoolCampusIndex,
): { code: string; name: string; main: boolean } {
  const hit = index.resolve(campus.year, campus.schoolCodeStd, campus.schoolName);
  if (!hit) {
    return { code: campus.schoolCodeStd, name: campus.schoolName, main: true };
  }
  const main = hit.mainBranchName === MAIN_BRANCH_LABEL;
  return {
    code: hit.schoolRepCode || campus.schoolCodeStd,
    name: hit.schoolRepName || campus.schoolName,
    main,
  };
}

function mergeCampuses(
  year: number,
  campuses: CampusMetric[],
  index: SchoolCampusIndex,
): StudentFillSchoolRow | null {
  if (!campuses.length) return null;
  const ranked = [...campuses].sort((a, b) => {
    const aMain = identity(a, index).main ? 1 : 0;
    const bMain = identity(b, index).main ? 1 : 0;
    if (bMain !== aMain) return bMain - aMain;
    return b.recruitTotal - a.recruitTotal;
  });
  const head = ranked[0]!;
  const id = identity(head, index);
  const division = studentFillDivisionFromKind(head.schoolKind);
  if (!division) return null;

  const recruitWithin = campuses.reduce((s, r) => s + r.recruitWithin, 0);
  const recruitOutside = campuses.reduce((s, r) => s + r.recruitOutside, 0);
  const recruitTotal = campuses.reduce((s, r) => s + r.recruitTotal, 0);
  const admitWithin = campuses.reduce((s, r) => s + r.admitWithin, 0);
  const admitOutside = campuses.reduce((s, r) => s + r.admitOutside, 0);
  const admitTotal = campuses.reduce((s, r) => s + r.admitTotal, 0);
  const region = head.region;

  return {
    schoolCodeStd: id.code,
    schoolName: id.name,
    schoolDivision: division,
    schoolKind: head.schoolKind,
    estb: head.estb,
    status: head.status,
    region,
    zone: zoneForSido(region),
    metro: metroFromRegion(region),
    enrolledTotal: null,
    scale: null,
    campusCount: campuses.length,
    recruitWithin,
    recruitOutside,
    recruitTotal,
    admitWithin,
    admitOutside,
    admitTotal,
    rateIn: pct(admitWithin, recruitWithin) ?? (head.storedRateIn > 0 ? head.storedRateIn : null),
    rateAll: pct(admitTotal, recruitTotal) ?? (head.storedRateAll > 0 ? head.storedRateAll : null),
    outShare: pct(admitOutside, admitTotal),
    recruitChange: null,
    studentQuota: null,
    enrolledFill: null,
    enrolledFillDenom: null,
    enrolledFillRate: null,
    enrolledFillRateIn: null,
    enrolledFillOutside: null,
    enrolledFillOutShare: null,
    enrolledOutside: null,
    enrolledOutShare: null,
    rosterTotal: null,
    leaveCount: null,
    leaveShare: null,
    deferCount: null,
    deferShare: null,
    dropoutCount: null,
    dropoutEnrolled: null,
    dropoutRate: null,
    freshmanDropoutCount: null,
    freshmanDropoutEnrolled: null,
    freshmanDropoutRate: null,
    foreignDegree: null,
    foreignJoint: null,
    foreignTraining: null,
    foreignTotal: null,
    foreignShare: null,
    langAbilityRate: null,
    foreignDropCount: null,
    foreignDropEnrolled: null,
    foreignDropRate: null,
    foreignDropAllCount: null,
    foreignDropAllEnrolled: null,
    foreignDropAllRate: null,
  };
}

function attachRecruitChange(
  current: StudentFillSchoolRow[],
  priorByCode: Map<string, number>,
): StudentFillSchoolRow[] {
  return current.map((row) => {
    const prior = priorByCode.get(row.schoolCodeStd);
    return {
      ...row,
      recruitChange:
        prior != null && prior > 0
          ? Math.round(((row.recruitTotal - prior) / prior) * 1000) / 10
          : null,
    };
  });
}

async function loadEligibleCampusRows(): Promise<CampusMetric[]> {
  const raw = await readCsvFile("financeAnalysisFreshmanEnrollment").catch(() => []);
  const rows: CampusMetric[] = [];
  for (const row of raw) {
    const parsed = parseCampus(row);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

async function rollupYear(
  campuses: CampusMetric[],
  year: number,
  index: SchoolCampusIndex,
): Promise<StudentFillSchoolRow[]> {
  const groups = new Map<string, CampusMetric[]>();
  for (const campus of campuses) {
    if (campus.year !== year) continue;
    const code = identity(campus, index).code;
    const list = groups.get(code) ?? [];
    list.push(campus);
    groups.set(code, list);
  }
  const schools: StudentFillSchoolRow[] = [];
  for (const group of groups.values()) {
    const merged = mergeCampuses(year, group, index);
    if (merged) schools.push(merged);
  }
  schools.sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
  return schools;
}

function aggregate(rows: StudentFillSchoolRow[], year: number): StudentFillNationalYear {
  const recruitIn = rows.reduce((s, r) => s + r.recruitWithin, 0);
  const recruitAll = rows.reduce((s, r) => s + r.recruitTotal, 0);
  const admitIn = rows.reduce((s, r) => s + r.admitWithin, 0);
  const admitOut = rows.reduce((s, r) => s + r.admitOutside, 0);
  const admitAll = rows.reduce((s, r) => s + r.admitTotal, 0);
  return {
    year,
    schools: rows.length,
    recruitIn,
    admitIn,
    rateIn: pct(admitIn, recruitIn),
    admitOut,
    outShare: pct(admitOut, admitAll),
    rateAll: pct(admitAll, recruitAll),
  };
}

export async function listStudentFillSourceYears(): Promise<number[]> {
  const campuses = await loadEligibleCampusRows();
  return [...new Set(campuses.map((row) => row.year))].sort((a, b) => b - a);
}

async function attachEnrolledAndScale(
  rows: StudentFillSchoolRow[],
  year: number,
  index: SchoolCampusIndex,
): Promise<StudentFillSchoolRow[]> {
  const ugRaw = await readCsvFile("univMapEnrolledStudentsUndergrad").catch(() => []);
  const enrolledByRep = new Map<string, number>();
  for (const raw of ugRaw) {
    const parsed = parseAlimiEnrolledStudentsUndergrad(raw);
    if (!parsed || parsed.year !== year) continue;
    const hit = index.resolve(year, parsed.schoolCodeStd, raw.school_name ?? "");
    const rep = padSchoolCode(hit?.schoolRepCode || parsed.schoolCodeStd);
    enrolledByRep.set(rep, (enrolledByRep.get(rep) ?? 0) + parsed.enrolledA);
  }

  return rows.map((row) => {
    const enrolledTotal = enrolledByRep.get(padSchoolCode(row.schoolCodeStd)) ?? null;
    const scaleKind = row.schoolDivision === "전문대학" ? "전문대" : "4년제";
    return {
      ...row,
      enrolledTotal,
      scale: schoolScaleFromEnrolled(enrolledTotal, scaleKind),
    };
  });
}

export async function loadStudentFillFreshmanSchools(
  analysisYear: number,
): Promise<StudentFillSchoolRow[]> {
  const [campuses, index] = await Promise.all([
    loadEligibleCampusRows(),
    loadSchoolCampusIndex(),
  ]);
  const current = await rollupYear(campuses, analysisYear, index);
  const prior = await rollupYear(campuses, analysisYear - 1, index);
  const priorByCode = new Map(prior.map((row) => [row.schoolCodeStd, row.recruitTotal]));
  return attachEnrolledAndScale(attachRecruitChange(current, priorByCode), analysisYear, index);
}

export async function loadStudentFillNationalTrend(): Promise<{
  university: StudentFillNationalYear[];
  juniorCollege: StudentFillNationalYear[];
}> {
  const [campuses, index] = await Promise.all([
    loadEligibleCampusRows(),
    loadSchoolCampusIndex(),
  ]);
  const years = [...new Set(campuses.map((row) => row.year))].sort((a, b) => a - b);
  const university: StudentFillNationalYear[] = [];
  const juniorCollege: StudentFillNationalYear[] = [];
  for (const year of years) {
    const schools = await rollupYear(campuses, year, index);
    university.push(
      aggregate(
        schools.filter((row) => row.schoolDivision === "대학"),
        year,
      ),
    );
    juniorCollege.push(
      aggregate(
        schools.filter((row) => row.schoolDivision === "전문대학"),
        year,
      ),
    );
  }
  return { university, juniorCollege };
}
