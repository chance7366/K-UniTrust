import { readdir } from "fs/promises";
import path from "path";

import {
  listPersistentPathnames,
  readPersistentTextFile,
  writePersistentTextFile,
} from "@/lib/persistent-data-file";

import type { StudentFillUniversityReport } from "./diagnosis";
import type { StudentFillEdition } from "./types";

const DIR = path.join(process.cwd(), "data", "json", "student-fill-analysis");

function runRel(year: number) {
  return `json/student-fill-analysis/${year}/run.json`;
}

function reportRel(year: number, schoolCodeStd: string) {
  return `json/student-fill-analysis/${year}/reports/${schoolCodeStd}.json`;
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
      if (Number.isInteger(year) && year >= 2000 && year <= 2100) {
        years.add(year);
      }
    }
  } catch {
    /* missing local dir */
  }

  const remote = await listPersistentPathnames("json/student-fill-analysis/");
  for (const pathname of remote) {
    const year = parseYearFromBlobPath(pathname);
    if (year) years.add(year);
  }

  const found: number[] = [];
  for (const year of years) {
    const edition = await readStudentFillEdition(year);
    if (edition) found.push(year);
  }
  return found.sort((a, b) => b - a);
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
