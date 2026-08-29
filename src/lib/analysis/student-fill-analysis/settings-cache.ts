import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import { peekLocalCsvVersion } from "@/lib/csv/read";
import { CSV_DIR } from "@/lib/csv/paths";
import { metroFromRegion } from "./types";
import type { StudentFillSchoolKind, StudentFillSchoolRow } from "./types";

const META_PATH = path.join(
  process.cwd(),
  "data",
  "json",
  "student-fill-analysis",
  "settings-cache.meta.json",
);
const SCHOOLS_PATH = path.join(CSV_DIR, "student_fill_settings_schools.csv");

const SOURCE_KEYS = [
  "financeAnalysisFreshmanEnrollmentUndergrad",
  "financeAnalysisFreshmanEnrollment",
  "financeAnalysisSchoolCode",
  "univMapEnrolledStudentsUndergrad",
] as const;

const COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "school_division",
  "school_kind",
  "estb",
  "status",
  "region",
  "zone",
  "metro",
  "enrolled_total",
  "scale",
  "campus_count",
] as const;

type CacheMeta = {
  fingerprint: string;
  years: number[];
};

export async function settingsCacheFingerprint(): Promise<string> {
  const parts = await Promise.all(SOURCE_KEYS.map((key) => peekLocalCsvVersion(key)));
  return parts.join(":");
}

function toSchoolRow(row: Record<string, string>): StudentFillSchoolRow | null {
  const schoolCodeStd = (row.school_code_std ?? "").trim();
  const schoolName = (row.school_name ?? "").trim();
  const schoolDivision = (row.school_division ?? "").trim();
  if (!schoolCodeStd || !schoolName) return null;
  if (schoolDivision !== "대학" && schoolDivision !== "전문대학") return null;
  const region = (row.region ?? "").trim();
  const enrolledRaw = row.enrolled_total?.trim() ?? "";
  const enrolledTotal = enrolledRaw === "" ? null : Number(enrolledRaw);
  return {
    schoolCodeStd,
    schoolName,
    schoolDivision: schoolDivision as StudentFillSchoolKind,
    schoolKind: (row.school_kind ?? "").trim(),
    estb: (row.estb ?? "").trim(),
    status: (row.status ?? "").trim(),
    region,
    zone: row.zone?.trim() || null,
    metro: row.metro === "수도권" || row.metro === "비수도권" ? row.metro : metroFromRegion(region),
    enrolledTotal: Number.isFinite(enrolledTotal) ? enrolledTotal : null,
    scale: (row.scale?.trim() || null) as StudentFillSchoolRow["scale"],
    campusCount: Number(row.campus_count) || 1,
    recruitWithin: 0,
    recruitOutside: 0,
    recruitTotal: 0,
    admitWithin: 0,
    admitOutside: 0,
    admitTotal: 0,
    rateIn: null,
    rateAll: null,
    outShare: null,
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

function fromSchoolRow(year: number, row: StudentFillSchoolRow): Record<string, string> {
  return {
    year: String(year),
    school_code_std: row.schoolCodeStd,
    school_name: row.schoolName,
    school_division: row.schoolDivision,
    school_kind: row.schoolKind,
    estb: row.estb,
    status: row.status,
    region: row.region,
    zone: row.zone ?? "",
    metro: row.metro,
    enrolled_total: row.enrolledTotal == null ? "" : String(row.enrolledTotal),
    scale: row.scale ?? "",
    campus_count: String(row.campusCount),
  };
}

export async function readSettingsCache(fingerprint: string): Promise<{
  years: number[];
  byYear: Map<number, StudentFillSchoolRow[]>;
} | null> {
  try {
    const meta = JSON.parse(await readFile(META_PATH, "utf8")) as CacheMeta;
    if (meta.fingerprint !== fingerprint || !Array.isArray(meta.years) || !meta.years.length) {
      return null;
    }
    const raw = await readFile(SCHOOLS_PATH, "utf8");
    if (!raw.trim()) return null;
    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[];
    const byYear = new Map<number, StudentFillSchoolRow[]>();
    for (const record of records) {
      const year = Number(record.year);
      const school = toSchoolRow(record);
      if (!Number.isFinite(year) || !school) continue;
      const list = byYear.get(year) ?? [];
      list.push(school);
      byYear.set(year, list);
    }
    if (!byYear.size) return null;
    return { years: [...meta.years].sort((a, b) => b - a), byYear };
  } catch {
    return null;
  }
}

export async function writeSettingsCache(
  fingerprint: string,
  years: number[],
  byYear: Map<number, StudentFillSchoolRow[]>,
): Promise<void> {
  const rows: Record<string, string>[] = [];
  for (const year of [...years].sort((a, b) => b - a)) {
    for (const school of byYear.get(year) ?? []) {
      rows.push(fromSchoolRow(year, school));
    }
  }
  const body = stringify(rows, {
    header: true,
    columns: [...COLUMNS],
    bom: true,
  });
  await mkdir(path.dirname(META_PATH), { recursive: true });
  await mkdir(CSV_DIR, { recursive: true });
  await writeFile(SCHOOLS_PATH, body, "utf8");
  await writeFile(
    META_PATH,
    JSON.stringify({ fingerprint, years: [...years].sort((a, b) => b - a) }),
    "utf8",
  );
}
