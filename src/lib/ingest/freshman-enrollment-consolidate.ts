import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import {
  FRESHMAN_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS,
} from "@/lib/ingest/freshman-enrollment-consolidated-config";
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

function calcFillRate(enrolled: number, recruit: number): number {
  if (!recruit) return 0;
  return Math.round((enrolled / recruit) * 10000) / 100;
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

export type ConsolidateYearResult = {
  year: number;
  rowCount: number;
  unmappedCount: number;
  schoolCodeYear: number | null;
  skipped: boolean;
  reason?: string;
};

export type ConsolidateFreshmanEnrollmentResult = {
  years: ConsolidateYearResult[];
  totalRows: number;
};

function aggregateYearRows(
  campusRows: Record<string, string>[],
  schoolCodeMap: Map<string, SchoolCodeMapping>,
  consolidatedAt: string,
): { rows: Record<string, string>[]; unmappedCount: number } {
  type Group = {
    base: Record<string, string>;
    baseRepCode: string;
    campuses: Record<string, string>[];
    admissionQuota: number;
    recruit: { total: number; within: number; outside: number };
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
    const repName =
      mapping?.schoolRepName ?? row.school_name?.trim() ?? codeStd;
    if (!mapping) unmappedCount += 1;

    const key = `${row.year}|${repCode}|${row.school_kind ?? ""}|${row.estb ?? ""}`;
    const existing = groups.get(key);

    const admissionQuota = num(row.admission_quota) ?? 0;
    const recruit = {
      total: num(row.recruit_total) ?? 0,
      within: num(row.recruit_within) ?? 0,
      outside: num(row.recruit_outside) ?? 0,
    };
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
        admissionQuota,
        recruit: { ...recruit },
        enrolled: { ...enrolled },
      });
      continue;
    }

    existing.campuses.push(row);
    existing.admissionQuota += admissionQuota;
    existing.recruit.total += recruit.total;
    existing.recruit.within += recruit.within;
    existing.recruit.outside += recruit.outside;
    existing.enrolled.total += enrolled.total;
    existing.enrolled.within += enrolled.within;
    existing.enrolled.outside += enrolled.outside;

    if (codeStd === repCode) {
      existing.base = row;
    }
  }

  const parsed: Record<string, string>[] = [];

  for (const group of groups.values()) {
    const repCode = group.baseRepCode;
    let mapping = schoolCodeMap.get(group.base.school_code_std?.trim() ?? "");
    if (!mapping?.schoolDivision) {
      for (const campus of group.campuses) {
        const campusMapping = schoolCodeMap.get(
          campus.school_code_std?.trim() ?? "",
        );
        if (campusMapping?.schoolDivision) {
          mapping = campusMapping;
          break;
        }
      }
    }
    const repName =
      mapping?.schoolRepName ??
      group.base.school_name?.trim() ??
      repCode;
    const schoolDivision =
      mapping?.schoolDivision ||
      group.base.school_division?.trim() ||
      "";

    const baseRegion =
      mapping?.region ||
      (group.base.school_code_std?.trim() === repCode
        ? group.base.region
        : "") ||
      group.base.region ||
      "";

    parsed.push({
      year: group.base.year ?? "",
      school_kind: group.base.school_kind ?? "",
      estb: group.base.estb ?? "",
      school_division: schoolDivision,
      region: baseRegion,
      status: group.base.status ?? mapping?.status ?? "",
      school_rep_code: repCode,
      school_rep_name: repName,
      campus_count: String(group.campuses.length),
      admission_quota: String(group.admissionQuota),
      recruit_total: String(group.recruit.total),
      recruit_within: String(group.recruit.within),
      recruit_outside: String(group.recruit.outside),
      enrolled_total: String(group.enrolled.total),
      enrolled_within: String(group.enrolled.within),
      enrolled_outside: String(group.enrolled.outside),
      fill_rate_within: String(
        calcFillRate(group.enrolled.within, group.recruit.within),
      ),
      fill_rate_within_outside: String(
        calcFillRate(group.enrolled.total, group.recruit.total),
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

export async function consolidateFreshmanEnrollmentYears(
  years?: number[],
): Promise<ConsolidateFreshmanEnrollmentResult> {
  const campusRows = await readCsvFile("financeAnalysisFreshmanEnrollment").catch(
    () => [],
  );
  const schoolCodeRows = await readCsvFile("financeAnalysisSchoolCode").catch(
    () => [],
  );

  const campusYearSet = new Set<number>();
  for (const r of campusRows) {
    const year = num(r.year);
    if (year) campusYearSet.add(year);
  }

  const schoolCodeYears = [
    ...new Set(
      schoolCodeRows
        .map((r) => num(r.year))
        .filter((y): y is number => y != null),
    ),
  ].sort((a, b) => a - b);

  const targetYears = (years ?? [...campusYearSet])
    .filter((y) => campusYearSet.has(y))
    .sort((a, b) => a - b);

  const consolidatedAt = new Date().toISOString();
  const yearResults: ConsolidateYearResult[] = [];
  const newByYear = new Map<number, Record<string, string>[]>();

  for (const year of targetYears) {
    const yearCampus = campusRows.filter((r) => Number(r.year) === year);
    const schoolCodeYear = resolveSchoolCodeYear(year, schoolCodeYears);

    if (schoolCodeYear == null) {
      yearResults.push({
        year,
        rowCount: 0,
        unmappedCount: yearCampus.length,
        schoolCodeYear: null,
        skipped: true,
        reason: "학교코드 데이터 없음",
      });
      continue;
    }

    const schoolCodeMap = buildSchoolCodeMap(schoolCodeRows, schoolCodeYear);
    const { rows, unmappedCount } = aggregateYearRows(
      yearCampus,
      schoolCodeMap,
      consolidatedAt,
    );

    newByYear.set(year, rows);
    yearResults.push({
      year,
      rowCount: rows.length,
      unmappedCount,
      schoolCodeYear,
      skipped: false,
    });
  }

  const existing = await readCsvFile(
    "financeAnalysisFreshmanEnrollmentConsolidated",
  ).catch(() => []);

  const replaceYearSet = new Set(
    yearResults.filter((r) => !r.skipped).map((r) => String(r.year)),
  );
  const kept = existing.filter((r) => !replaceYearSet.has(r.year ?? ""));
  const divisionLookup = await loadSchoolDivisionLookup();
  const merged = enrichRowsWithSchoolDivision(
    [...kept, ...[...newByYear.values()].flat()],
    divisionLookup,
  );

  await writeCsvFile(
    "financeAnalysisFreshmanEnrollmentConsolidated",
    merged,
    [...FRESHMAN_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS],
  );

  const totalRows = yearResults.reduce((sum, r) => sum + r.rowCount, 0);


  return { years: yearResults, totalRows };
}
