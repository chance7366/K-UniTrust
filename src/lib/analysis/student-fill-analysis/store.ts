import { readdir, readFile, stat } from "fs/promises";
import path from "path";

import {
  listPersistentPathnames,
  readPersistentTextFile,
  writePersistentTextFile,
} from "@/lib/persistent-data-file";

import type { StudentFillComprehensiveReport } from "./comprehensive-report-types";
import type { StudentFillUniversityReport } from "./diagnosis";
import type { StudentFillEdition } from "./types";

const DIR = path.join(process.cwd(), "data", "json", "student-fill-analysis");

function runRel(year: number) {
  return `json/student-fill-analysis/${year}/run.json`;
}

function reportRel(year: number, schoolCodeStd: string) {
  return `json/student-fill-analysis/${year}/reports/${schoolCodeStd}.json`;
}

function comprehensiveRel(year: number, filterKey: string) {
  return `json/student-fill-analysis/${year}/comprehensive/${filterKey}.json`;
}

function parseYearFromBlobPath(pathname: string): number | null {
  const match = pathname.match(
    /json\/student-fill-analysis\/(\d{4})(?:\/|$)/,
  );
  if (!match) return null;
  const year = Number(match[1]);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}

export async function listStudentFillEditionYears(): Promise<number[]> {
  const years = new Set<number>();
  try {
    const names = await readdir(DIR);
    for (const name of names) {
      const year = Number(name);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) continue;
      try {
        await stat(path.join(DIR, name, "run.json"));
        years.add(year);
      } catch {
        /* folder without run.json */
      }
    }
  } catch {
    /* missing local dir */
  }

  const remote = await listPersistentPathnames("json/student-fill-analysis/");
  for (const pathname of remote) {
    if (!/\/run\.json$/i.test(pathname)) continue;
    const year = parseYearFromBlobPath(pathname);
    if (year) years.add(year);
  }

  return [...years].sort((a, b) => b - a);
}

export async function readStudentFillEditionLastRunAt(
  year: number,
): Promise<string | null> {
  try {
    const raw = await readFile(path.join(DIR, String(year), "run.json"), "utf8");
    const parsed = JSON.parse(raw) as { lastRunAt?: unknown };
    return typeof parsed.lastRunAt === "string" ? parsed.lastRunAt : null;
  } catch {
    return null;
  }
}

export async function readStudentFillEdition(
  year: number,
): Promise<StudentFillEdition | null> {
  try {
    const raw = await readPersistentTextFile(runRel(year));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentFillEdition;
    if (parsed?.analysisYear !== year || !Array.isArray(parsed.schools)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStudentFillEdition(edition: StudentFillEdition) {
  await writePersistentTextFile(
    runRel(edition.analysisYear),
    JSON.stringify(edition),
  );
}

export async function readStudentFillUniversityReport(
  year: number,
  schoolCodeStd: string,
): Promise<StudentFillUniversityReport | null> {
  try {
    const raw = await readPersistentTextFile(reportRel(year, schoolCodeStd));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentFillUniversityReport;
    if (parsed?.analysisYear !== year || parsed.schoolCodeStd !== schoolCodeStd) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStudentFillUniversityReport(
  report: StudentFillUniversityReport,
) {
  await writePersistentTextFile(
    reportRel(report.analysisYear, report.schoolCodeStd),
    JSON.stringify(report),
  );
}

export async function readStudentFillComprehensiveReport(
  year: number,
  filterKey: string,
): Promise<StudentFillComprehensiveReport | null> {
  try {
    const raw = await readPersistentTextFile(comprehensiveRel(year, filterKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentFillComprehensiveReport;
    if (parsed?.analysisYear !== year || parsed.filterKey !== filterKey) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStudentFillComprehensiveReport(
  report: StudentFillComprehensiveReport,
) {
  await writePersistentTextFile(
    comprehensiveRel(report.analysisYear, report.filterKey),
    JSON.stringify(report),
  );
}
