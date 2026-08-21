import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import path from "path";

import { UNIVERSITY_REPORT_GUIDELINES_VERSION } from "@/lib/competitiveness-analysis/university-report/generation-guidelines";

export type UniversityReportMeta = {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  generatedAt: string;
  model: string;
  guidelinesVersion: string;
  htmlFile: string;
  pdfFile?: string;
  pdfGeneratedAt?: string;
};

const REPORTS_ROOT = path.join(
  process.cwd(),
  "data",
  "reports",
  "competitiveness",
);

function reportDir(analysisYear: number, schoolCodeStd: string): string {
  return path.join(REPORTS_ROOT, String(analysisYear), schoolCodeStd);
}

export function universityReportHtmlPath(
  analysisYear: number,
  schoolCodeStd: string,
): string {
  return path.join(reportDir(analysisYear, schoolCodeStd), "report.html");
}

export function universityReportPdfPath(
  analysisYear: number,
  schoolCodeStd: string,
): string {
  return path.join(reportDir(analysisYear, schoolCodeStd), "report.pdf");
}

export function universityReportMetaPath(
  analysisYear: number,
  schoolCodeStd: string,
): string {
  return path.join(reportDir(analysisYear, schoolCodeStd), "meta.json");
}

export async function saveUniversityReport(args: {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  html: string;
  model: string;
}): Promise<UniversityReportMeta> {
  const dir = reportDir(args.analysisYear, args.schoolCodeStd);
  await mkdir(dir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const htmlFile = "report.html";
  const htmlPath = path.join(dir, htmlFile);
  const metaPath = path.join(dir, "meta.json");

  const meta: UniversityReportMeta = {
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    schoolName: args.schoolName,
    generatedAt,
    model: args.model,
    guidelinesVersion: UNIVERSITY_REPORT_GUIDELINES_VERSION,
    htmlFile,
  };

  await writeFile(htmlPath, args.html, "utf8");
  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

  return meta;
}

export async function loadUniversityReportMeta(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<UniversityReportMeta | null> {
  try {
    const raw = await readFile(
      universityReportMetaPath(analysisYear, schoolCodeStd),
      "utf8",
    );
    return JSON.parse(raw) as UniversityReportMeta;
  } catch {
    return null;
  }
}

export async function loadUniversityReportHtml(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<string | null> {
  try {
    return await readFile(
      universityReportHtmlPath(analysisYear, schoolCodeStd),
      "utf8",
    );
  } catch {
    return null;
  }
}

export async function listUniversityReportsForYear(
  analysisYear: number,
): Promise<UniversityReportMeta[]> {
  const yearDir = path.join(REPORTS_ROOT, String(analysisYear));
  let entries: string[];
  try {
    entries = await readdir(yearDir);
  } catch {
    return [];
  }

  const metas: UniversityReportMeta[] = [];
  for (const schoolCodeStd of entries) {
    const meta = await loadUniversityReportMeta(analysisYear, schoolCodeStd);
    if (meta) metas.push(meta);
  }

  return metas.sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName, "ko"),
  );
}

export async function universityReportExists(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<boolean> {
  try {
    await stat(universityReportHtmlPath(analysisYear, schoolCodeStd));
    return true;
  } catch {
    return false;
  }
}
