import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { DROPOUT_RATE_CONSOLIDATED_CSV_COLUMNS } from "@/lib/ingest/dropout-rate-consolidated-config";
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

function calcDropoutRate(dropouts: number, total: number): number {
  if (!total) return 0;
  return Math.round((dropouts / total) * 10000) / 100;
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

export type ConsolidateDropoutRateResult = {
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
    enrolled: { total: number; dropouts: number };
    freshman: { total: number; dropouts: number };
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

    const enrolled = {
      total: num(row.enrolled_students) ?? 0,
      dropouts: num(row.enrolled_dropouts) ?? 0,
    };
    const freshman = {
      total: num(row.freshman_students) ?? 0,
      dropouts: num(row.freshman_dropouts) ?? 0,
    };

    if (!existing) {
      groups.set(key, {
        base: row,
        baseRepCode: repCode,
        campuses: [row],
        enrolled: { ...enrolled },
        freshman: { ...freshman },
      });
      continue;
    }

    existing.campuses.push(row);
    existing.enrolled.total += enrolled.total;
    existing.enrolled.dropouts += enrolled.dropouts;
    existing.freshman.total += freshman.total;
    existing.freshman.dropouts += freshman.dropouts;

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
      enrolled_students: String(group.enrolled.total),
      enrolled_dropouts: String(group.enrolled.dropouts),
      enrolled_dropout_rate: String(
        calcDropoutRate(group.enrolled.dropouts, group.enrolled.total),
      ),
      freshman_students: String(group.freshman.total),
      freshman_dropouts: String(group.freshman.dropouts),
      freshman_dropout_rate: String(
        calcDropoutRate(group.freshman.dropouts, group.freshman.total),
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

export async function consolidateDropoutRateYears(
  years?: number[],
): Promise<ConsolidateDropoutRateResult> {
  const campusRows = await readCsvFile("financeAnalysisDropoutRate").catch(
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
    "financeAnalysisDropoutRateConsolidated",
  ).catch(() => []);

  const replaceYearSet = new Set(
    yearResults.filter((r) => !r.skipped).map((r) => String(r.year)),
  );
  const kept = existing.filter((r) => !replaceYearSet.has(r.year ?? ""));
  const merged = enrichRowsWithSchoolDivision(
    [...kept, ...[...newByYear.values()].flat()],
    await loadSchoolDivisionLookup(),
  );

  await writeCsvFile(
    "financeAnalysisDropoutRateConsolidated",
    merged,
    [...DROPOUT_RATE_CONSOLIDATED_CSV_COLUMNS],
  );

  const totalRows = yearResults.reduce((sum, r) => sum + r.rowCount, 0);


  return { years: yearResults, totalRows };
}
