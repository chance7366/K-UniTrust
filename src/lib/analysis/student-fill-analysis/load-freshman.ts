import { parseAlimiEnrolledStudentsUndergrad } from "@/lib/analysis/enrolled-students-rep-count";
import {
  parseAlimiUndergradRow,
  parseYearText,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { loadCsvYearMapped } from "@/lib/csv/csv-year-load";
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
import {
  readSettingsCache,
  settingsCacheFingerprint,
  writeSettingsCache,
} from "./settings-cache";

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

function parseAlimiCampus(row: Record<string, string>): CampusMetric | null {
  const parsed = parseAlimiUndergradRow(row);
  if (!parsed) return null;
  const schoolName = (row.school_name ?? "").trim();
  const schoolKind = (row.school_kind ?? "").trim();
  const estb = (row.estb ?? "").trim();
  const status = (row.status ?? "").trim();
  if (!schoolName) return null;
  if (!isStudentFillEligibleCampus({ estb, schoolKind, status })) return null;
  if (!studentFillDivisionFromKind(schoolKind)) return null;

  return {
    year: parsed.year,
    schoolCodeStd: padSchoolCode(parsed.schoolCodeStd),
    schoolName,
    schoolKind,
    estb,
    status,
    region: (row.region ?? "").trim(),
    recruitWithin: parsed.recruit.within,
    recruitOutside: parsed.recruit.outside,
    recruitTotal:
      parsed.recruit.total || parsed.recruit.within + parsed.recruit.outside,
    admitWithin: parsed.enrolled.within,
    admitOutside: parsed.enrolled.outside,
    admitTotal:
      parsed.enrolled.total || parsed.enrolled.within + parsed.enrolled.outside,
    storedRateIn: 0,
    storedRateAll: 0,
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
  const campus = index.resolve(head.year, head.schoolCodeStd, head.schoolName);
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
    estb: campus?.estb?.trim() || head.estb,
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

function freshmanYearOf(row: Record<string, string>): number | null {
  return parseYearText(row.year_text ?? "") ?? yearOf(row.year);
}

async function loadAlimiCampusCatalog(
  year: number | "latest" | null,
  mapAllYears = false,
  localOnly = false,
) {
  return loadCsvYearMapped({
    csvKey: "financeAnalysisFreshmanEnrollmentUndergrad",
    cacheKey: localOnly
      ? "studentFill:alimiFreshmanCampus:local"
      : "studentFill:alimiFreshmanCampus",
    yearOf: freshmanYearOf,
    mapRow: parseAlimiCampus,
    year,
    mapAllYears,
    localOnly,
  });
}

async function loadStructuredCampusCatalog(
  year: number | "latest" | null,
  mapAllYears = false,
  localOnly = false,
) {
  return loadCsvYearMapped({
    csvKey: "financeAnalysisFreshmanEnrollment",
    cacheKey: localOnly
      ? "studentFill:structuredFreshmanCampus:local"
      : "studentFill:structuredFreshmanCampus",
    yearOf: freshmanYearOf,
    mapRow: parseCampus,
    year,
    mapAllYears,
    localOnly,
  });
}

async function loadCampusYear(year: number): Promise<CampusMetric[]> {
  const alimi = await loadAlimiCampusCatalog(year);
  if (alimi.rows.length) return alimi.rows;
  const structured = await loadStructuredCampusCatalog(year);
  return structured.rows;
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
    enrolledFillRate: null,
    enrolledFillRateIn: null,
    dropoutRate: null,
    freshmanDropoutRate: null,
    foreignShare: null,
    foreignDropRate: null,
    leaveShare: null,
  };
}

export async function listStudentFillSourceYears(): Promise<number[]> {
  const [alimi, structured] = await Promise.all([
    loadAlimiCampusCatalog(null),
    loadStructuredCampusCatalog(null),
  ]);
  return [...new Set([...alimi.years, ...structured.years])].sort((a, b) => b - a);
}

async function attachEnrolledAndScale(
  rows: StudentFillSchoolRow[],
  year: number,
  index: SchoolCampusIndex,
  localOnly = false,
): Promise<StudentFillSchoolRow[]> {
  const mapped = await loadCsvYearMapped({
    csvKey: "univMapEnrolledStudentsUndergrad",
    cacheKey: localOnly ? "studentFill:enrolledScale:local" : "studentFill:enrolledScale",
    yearOf: (row) => yearOf(row.year_text) ?? yearOf(row.year),
    year,
    localOnly,
    mapRow: (raw) => {
      const parsed = parseAlimiEnrolledStudentsUndergrad(raw);
      if (!parsed) return null;
      return {
        schoolCodeStd: parsed.schoolCodeStd,
        schoolName: raw.school_name ?? "",
        enrolledA: parsed.enrolledA,
      };
    },
  });
  const enrolledByRep = new Map<string, number>();
  for (const parsed of mapped.rows) {
    const hit = index.resolve(year, parsed.schoolCodeStd, parsed.schoolName);
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

const settingsInflight = new Map<
  string,
  Promise<{
    years: number[];
    displayYear: number | null;
    schools: StudentFillSchoolRow[];
  }>
>();

export async function loadStudentFillSettingsSnapshot(
  requestedYear: number | null,
): Promise<{
  years: number[];
  displayYear: number | null;
  schools: StudentFillSchoolRow[];
}> {
  const key =
    requestedYear != null && Number.isFinite(requestedYear) ? String(requestedYear) : "latest";
  const pending = settingsInflight.get(key);
  if (pending) return pending;
  const next = loadStudentFillSettingsSnapshotUncached(requestedYear).finally(() => {
    settingsInflight.delete(key);
  });
  settingsInflight.set(key, next);
  return next;
}

async function buildSettingsYear(displayYear: number): Promise<StudentFillSchoolRow[]> {
  let campuses = (await loadAlimiCampusCatalog(displayYear, false, true)).rows;
  if (!campuses.length) {
    campuses = (await loadStructuredCampusCatalog(displayYear, false, true)).rows;
  }
  const index = await loadSchoolCampusIndex({ localOnly: true });
  return attachEnrolledAndScale(
    await rollupYear(campuses, displayYear, index),
    displayYear,
    index,
    true,
  );
}

async function loadStudentFillSettingsSnapshotUncached(
  requestedYear: number | null,
): Promise<{
  years: number[];
  displayYear: number | null;
  schools: StudentFillSchoolRow[];
}> {
  const hint =
    requestedYear != null && Number.isFinite(requestedYear) && requestedYear >= 2000
      ? requestedYear
      : "latest";
  const fingerprint = await settingsCacheFingerprint();
  const cache = await readSettingsCache(fingerprint);
  if (cache) {
    const displayYear =
      typeof hint === "number" && cache.years.includes(hint)
        ? hint
        : (cache.years[0] ?? null);
    if (displayYear == null) {
      return { years: cache.years, displayYear: null, schools: [] };
    }
    const cached = cache.byYear.get(displayYear);
    if (cached?.length) {
      return { years: cache.years, displayYear, schools: cached };
    }
    const schools = await buildSettingsYear(displayYear);
    cache.byYear.set(displayYear, schools);
    await writeSettingsCache(fingerprint, cache.years, cache.byYear).catch(() => {});
    return { years: cache.years, displayYear, schools };
  }

  const [alimi, structured] = await Promise.all([
    loadAlimiCampusCatalog(hint, false, true),
    loadStructuredCampusCatalog(null, false, true),
  ]);
  const years = [...new Set([...alimi.years, ...structured.years])].sort((a, b) => b - a);
  const displayYear =
    typeof hint === "number" && years.includes(hint) ? hint : (years[0] ?? null);
  if (displayYear == null) {
    return { years, displayYear: null, schools: [] };
  }
  let campuses =
    alimi.displayYear === displayYear && alimi.rows.length
      ? alimi.rows
      : (await loadAlimiCampusCatalog(displayYear, false, true)).rows;
  if (!campuses.length) {
    campuses = (await loadStructuredCampusCatalog(displayYear, false, true)).rows;
  }
  const index = await loadSchoolCampusIndex({ localOnly: true });
  const schools = await attachEnrolledAndScale(
    await rollupYear(campuses, displayYear, index),
    displayYear,
    index,
    true,
  );
  await writeSettingsCache(fingerprint, years, new Map([[displayYear, schools]])).catch(
    () => {},
  );
  return { years, displayYear, schools };
}

export async function loadStudentFillFreshmanSchools(
  analysisYear: number,
  options?: { includePrior?: boolean; includeScale?: boolean },
): Promise<StudentFillSchoolRow[]> {
  const includePrior = options?.includePrior ?? true;
  const includeScale = options?.includeScale ?? true;
  const [currentCampuses, priorCampuses, index] = await Promise.all([
    loadCampusYear(analysisYear),
    includePrior ? loadCampusYear(analysisYear - 1) : Promise.resolve([]),
    loadSchoolCampusIndex(),
  ]);
  const current = await rollupYear(currentCampuses, analysisYear, index);
  const prior = includePrior
    ? await rollupYear(priorCampuses, analysisYear - 1, index)
    : [];
  const priorByCode = new Map(prior.map((row) => [row.schoolCodeStd, row.recruitTotal]));
  const withChange = attachRecruitChange(current, priorByCode);
  if (!includeScale) return withChange;
  return attachEnrolledAndScale(withChange, analysisYear, index);
}

export async function loadStudentFillNationalTrend(): Promise<{
  university: StudentFillNationalYear[];
  juniorCollege: StudentFillNationalYear[];
}> {
  const [alimi, structured, index] = await Promise.all([
    loadAlimiCampusCatalog("latest", true),
    loadStructuredCampusCatalog("latest", true),
    loadSchoolCampusIndex(),
  ]);
  const years = [...new Set([...alimi.years, ...structured.years])];
  const university: StudentFillNationalYear[] = [];
  const juniorCollege: StudentFillNationalYear[] = [];
  for (const year of [...years].sort((a, b) => a - b)) {
    const schools = await rollupYear(await loadCampusYear(year), year, index);
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
