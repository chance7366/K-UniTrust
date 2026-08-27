import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type { StudentFillUniversityReport } from "./diagnosis";
import type { StudentFillEdition } from "./types";

const DIR = path.join(process.cwd(), "data", "json", "student-fill-analysis");

function runPath(year: number) {
  return path.join(DIR, String(year), "run.json");
}

export async function listStudentFillEditionYears(): Promise<number[]> {
  try {
    const names = await readdir(DIR);
    const years: number[] = [];
    for (const name of names) {
      const year = Number(name);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) continue;
      const edition = await readStudentFillEdition(year);
      if (edition) years.push(year);
    }
    return years.sort((a, b) => b - a);
  } catch {
    return [];
  }
}

export async function readStudentFillEdition(
  year: number,
): Promise<StudentFillEdition | null> {
  try {
    const raw = await readFile(runPath(year), "utf8");
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
  const dir = path.join(DIR, String(edition.analysisYear));
  await mkdir(dir, { recursive: true });
  await writeFile(runPath(edition.analysisYear), JSON.stringify(edition), "utf8");
}

function reportPath(year: number, schoolCodeStd: string) {
  return path.join(DIR, String(year), "reports", `${schoolCodeStd}.json`);
}

export async function readStudentFillUniversityReport(
  year: number,
  schoolCodeStd: string,
): Promise<StudentFillUniversityReport | null> {
  try {
    const raw = await readFile(reportPath(year, schoolCodeStd), "utf8");
    const parsed = JSON.parse(raw) as StudentFillUniversityReport;
    if (parsed?.analysisYear !== year || parsed.schoolCodeStd !== schoolCodeStd) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStudentFillUniversityReport(report: StudentFillUniversityReport) {
  const dir = path.join(DIR, String(report.analysisYear), "reports");
  await mkdir(dir, { recursive: true });
  await writeFile(reportPath(report.analysisYear, report.schoolCodeStd), JSON.stringify(report), "utf8");
}
