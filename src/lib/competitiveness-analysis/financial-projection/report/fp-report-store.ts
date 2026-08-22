import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";

import { FP_REPORT_GUIDELINES_VERSION } from "./generation-guidelines";

export type FpReportMeta = {
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
  "financial-projection",
);

function reportDir(analysisYear: number, schoolCodeStd: string): string {
  return path.join(REPORTS_ROOT, String(analysisYear), schoolCodeStd);
}

export function fpReportHtmlPath(
  analysisYear: number,
  schoolCodeStd: string,
): string {
  return path.join(reportDir(analysisYear, schoolCodeStd), "report.html");
}

export function fpReportPdfPath(
  analysisYear: number,
  schoolCodeStd: string,
): string {
  return path.join(reportDir(analysisYear, schoolCodeStd), "report.pdf");
}

export function fpReportMetaPath(
  analysisYear: number,
  schoolCodeStd: string,
): string {
  return path.join(reportDir(analysisYear, schoolCodeStd), "meta.json");
}

export async function saveFpReport(args: {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  html: string;
  model: string;
}): Promise<FpReportMeta> {
  const dir = reportDir(args.analysisYear, args.schoolCodeStd);
  await mkdir(dir, { recursive: true });

  const meta: FpReportMeta = {
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    schoolName: args.schoolName,
    generatedAt: new Date().toISOString(),
    model: args.model,
    guidelinesVersion: FP_REPORT_GUIDELINES_VERSION,
    htmlFile: "report.html",
  };

  await writeFile(path.join(dir, "report.html"), args.html, "utf8");
  await writeFile(
    path.join(dir, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf8",
  );
  return meta;
}

export async function loadFpReportMeta(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<FpReportMeta | null> {
  try {
    const raw = await readFile(
      fpReportMetaPath(analysisYear, schoolCodeStd),
      "utf8",
    );
    return JSON.parse(raw) as FpReportMeta;
  } catch {
    return null;
  }
}

export async function loadFpReportHtml(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<string | null> {
  try {
    return await readFile(fpReportHtmlPath(analysisYear, schoolCodeStd), "utf8");
  } catch {
    return null;
  }
}

export async function fpReportExists(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<boolean> {
  try {
    await stat(fpReportHtmlPath(analysisYear, schoolCodeStd));
    return true;
  } catch {
    return false;
  }
}
