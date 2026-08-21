import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { ENROLLED_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS } from "@/lib/ingest/enrolled-enrollment-consolidated-config";
import {
  enrolledPeriodKey,
  parseEnrolledPeriodKey,
} from "@/lib/ingest/enrolled-enrollment-period";
import {
  enrichRowsWithSchoolDivision,
  loadSchoolDivisionLookup,
} from "@/lib/ingest/school-code-lookup";

type SchoolCodeMapping = {
  schoolRepCode: string;
  schoolRepName: string;
  region: string;
  estb: string;
  schoolKind: string;
  schoolDivision: string;
  status: string;
};

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 재학생충원율 = 재학생수 / (재학생정원 - 재학생모집중단정원) */
function calcEnrolledFillRate(enrolled: number, effectiveQuota: number): number {
  if (!effectiveQuota) return 0;
  return Math.round((enrolled / effectiveQuota) * 10000) / 100;
}

function resolveSchoolCodeYear(
  enrollmentYear: number,
  availableYears: number[],
): number | null {
  if (!availableYears.length) return null;
  if (availableYears.includes(enrollmentYear)) return enrollmentYear;
  const prior = availableYears.filter((y) => y <= enrollmentYear);
  if (prior.length) return Math.max(...prior);
  return Math.min(...availableYears);
}

function buildSchoolCodeMap(
  rows: Record<string, string>[],
  schoolCodeYear: number,
): Map<string, SchoolCodeMapping> {
  const map = new Map<string, SchoolCodeMapping>();
  for (const r of rows) {
    const year = num(r.year);
    const code = r.school_code_std?.trim();
    if (year !== schoolCodeYear || !code) continue;
    map.set(code, {
      schoolRepCode: r.school_rep_code?.trim() || code,
      schoolRepName: r.school_rep_name?.trim() || r.school_name?.trim() || "",
      region: r.region ?? "",
      estb: r.estb ?? "",
      schoolKind: r.school_kind ?? "",
      schoolDivision: r.school_division ?? "",
      status: r.status ?? "",
    });
  }
  return map;
}

export type ConsolidatePeriodResult = {
  period: string;
  year: number;
  half: string;
  rowCount: number;
  unmappedCount: number;
  schoolCodeYear: number | null;
  skipped: boolean;
  reason?: string;
};

export type ConsolidateEnrolledEnrollmentResult = {
  periods: ConsolidatePeriodResult[];
  totalRows: number;
};

function aggregatePeriodRows(
  campusRows: Record<string, string>[],
  schoolCodeMap: Map<string, SchoolCodeMapping>,
  consolidatedAt: string,
): { rows: Record<string, string>[]; unmappedCount: number } {
  type Group = {
    base: Record<string, string>;
    baseRepCode: string;
    campuses: Record<string, string>[];
    studentQuota: number;
    recruitmentSuspension: number;
    enrolled: { total: number; within: number; outside: number };
  };

  const groups = new Map<string, Group>();
  let unmappedCount = 0;

  for (const row of campusRows) {
    const codeStd = row.school_code_std?.trim();
    if (!codeStd) {
      unmappedCount += 1;
      continue;
    }

    const mapping = schoolCodeMap.get(codeStd);
    const repCode = mapping?.schoolRepCode ?? codeStd;
    if (!mapping) unmappedCount += 1;

    const key = `${row.year}|${row.half}|${repCode}|${row.school_kind ?? ""}|${row.estb ?? ""}`;
    const existing = groups.get(key);

    const studentQuota = num(row.student_quota) ?? 0;
    const recruitmentSuspension = num(row.recruitment_suspension) ?? 0;
    const enrolled = {
      total: num(row.enrolled_total) ?? 0,
      within: num(row.enrolled_within) ?? 0,
      outside: num(row.enrolled_outside) ?? 0,
    };

    if (!existing) {
      groups.set(key, {
        base: row,
        baseRepCode: repCode,
        campuses: [row],
        studentQuota,
        recruitmentSuspension,
        enrolled: { ...enrolled },
      });
      continue;
    }

    existing.campuses.push(row);
    existing.studentQuota += studentQuota;
    existing.recruitmentSuspension += recruitmentSuspension;
    existing.enrolled.total += enrolled.total;
    existing.enrolled.within += enrolled.within;
    existing.enrolled.outside += enrolled.outside;

    if (codeStd === repCode) {
      existing.base = row;
    }
  }

  const parsed: Record<string, string>[] = [];

  for (const group of groups.values()) {
    const mapping = schoolCodeMap.get(group.base.school_code_std?.trim() ?? "");
    const repCode = group.baseRepCode;
    const repName =
      mapping?.schoolRepName ??
      group.base.school_name?.trim() ??
      repCode;

    const baseRegion =
      mapping?.region ||
      (group.base.school_code_std?.trim() === repCode
        ? group.base.region
        : "") ||
      group.base.region ||
      "";
    const schoolDivision =
      mapping?.schoolDivision ||
      group.base.school_division?.trim() ||
      "";

    const effectiveQuota =
      group.studentQuota - group.recruitmentSuspension;

    parsed.push({
      year: group.base.year ?? "",
      half: group.base.half ?? "",
      school_kind: group.base.school_kind ?? "",
      estb: group.base.estb ?? "",
      school_division: schoolDivision,
      region: baseRegion,
      status: group.base.status ?? mapping?.status ?? "",
      school_rep_code: repCode,
      school_rep_name: repName,
      campus_count: String(group.campuses.length),
      student_quota: String(group.studentQuota),
      recruitment_suspension: String(group.recruitmentSuspension),
      enrolled_total: String(group.enrolled.total),
      enrolled_within: String(group.enrolled.within),
      enrolled_outside: String(group.enrolled.outside),
      fill_rate: String(
        calcEnrolledFillRate(group.enrolled.total, effectiveQuota),
      ),
      fill_rate_within: String(
        calcEnrolledFillRate(group.enrolled.within, effectiveQuota),
      ),
      consolidated_at: consolidatedAt,
    });
  }

  parsed.sort(
    (a, b) =>
      (a.region ?? "").localeCompare(b.region ?? "", "ko") ||
      (a.school_rep_name ?? "").localeCompare(b.school_rep_name ?? "", "ko"),
  );

  return { rows: parsed, unmappedCount };
}

export async function consolidateEnrolledEnrollmentPeriods(
  periods?: string[],
): Promise<ConsolidateEnrolledEnrollmentResult> {
  const campusRows = await readCsvFile("financeAnalysisEnrolledEnrollment").catch(
    () => [],
  );
  const schoolCodeRows = await readCsvFile("financeAnalysisSchoolCode").catch(
    () => [],
  );

  const campusPeriodSet = new Set<string>();
  for (const r of campusRows) {
    const year = num(r.year);
    const half = r.half?.trim();
    if (year && half) campusPeriodSet.add(enrolledPeriodKey(year, half));
  }

  const schoolCodeYears = [
    ...new Set(
      schoolCodeRows
        .map((r) => num(r.year))
        .filter((y): y is number => y != null),
    ),
  ].sort((a, b) => a - b);

  const targetPeriods = (periods ?? [...campusPeriodSet])
    .filter((p) => campusPeriodSet.has(p))
    .sort();

  const consolidatedAt = new Date().toISOString();
  const periodResults: ConsolidatePeriodResult[] = [];
  const newByPeriod = new Map<string, Record<string, string>[]>();

  for (const period of targetPeriods) {
    const parsed = parseEnrolledPeriodKey(period);
    if (!parsed) continue;

    const { year, half } = parsed;
    const periodCampus = campusRows.filter(
      (r) => Number(r.year) === year && (r.half?.trim() ?? "") === half,
    );
    const schoolCodeYear = resolveSchoolCodeYear(year, schoolCodeYears);

    if (schoolCodeYear == null) {
      periodResults.push({
        period,
        year,
        half,
        rowCount: 0,
        unmappedCount: periodCampus.length,
        schoolCodeYear: null,
        skipped: true,
        reason: "학교코드 데이터 없음",
      });
      continue;
    }

    const schoolCodeMap = buildSchoolCodeMap(schoolCodeRows, schoolCodeYear);
    const { rows, unmappedCount } = aggregatePeriodRows(
      periodCampus,
      schoolCodeMap,
      consolidatedAt,
    );

    newByPeriod.set(period, rows);
    periodResults.push({
      period,
      year,
      half,
      rowCount: rows.length,
      unmappedCount,
      schoolCodeYear,
      skipped: false,
    });
  }

  const existing = await readCsvFile(
    "financeAnalysisEnrolledEnrollmentConsolidated",
  ).catch(() => []);

  const replacePeriodSet = new Set(
    periodResults.filter((r) => !r.skipped).map((r) => r.period),
  );
  const kept = existing.filter(
    (r) =>
      !replacePeriodSet.has(
        enrolledPeriodKey(r.year ?? "", r.half?.trim() ?? ""),
      ),
  );
  const merged = enrichRowsWithSchoolDivision(
    [...kept, ...[...newByPeriod.values()].flat()],
    await loadSchoolDivisionLookup(),
  );

  await writeCsvFile(
    "financeAnalysisEnrolledEnrollmentConsolidated",
    merged,
    [...ENROLLED_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS],
  );

  const totalRows = periodResults.reduce((sum, r) => sum + r.rowCount, 0);


  return { periods: periodResults, totalRows };
}
