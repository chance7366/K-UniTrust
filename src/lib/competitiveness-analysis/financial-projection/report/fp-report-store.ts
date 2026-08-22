import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import path from "path";

import {
  getReportBinaryFile,
  getReportTextFile,
  listReportSchoolCodes,
  putReportBinaryFile,
  putReportTextFile,
} from "@/lib/reports/blob-report-storage";
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

  await putReportTextFile({
    domain: "financial-projection",
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    fileName: "report.html",
    content: args.html,
  });
  await putReportTextFile({
    domain: "financial-projection",
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    fileName: "meta.json",
    content: JSON.stringify(meta, null, 2),
  });

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
    const remote = await getReportTextFile({
      domain: "financial-projection",
      analysisYear,
      schoolCodeStd,
      fileName: "meta.json",
    });
    if (!remote) return null;
    try {
      return JSON.parse(remote) as FpReportMeta;
    } catch {
      return null;
    }
  }
}

export async function loadFpReportHtml(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<string | null> {
  try {
    return await readFile(fpReportHtmlPath(analysisYear, schoolCodeStd), "utf8");
  } catch {
    return getReportTextFile({
      domain: "financial-projection",
      analysisYear,
      schoolCodeStd,
      fileName: "report.html",
    });
  }
}

export async function loadFpReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer | null> {
  try {
    return await readFile(fpReportPdfPath(analysisYear, schoolCodeStd));
  } catch {
    return getReportBinaryFile({
      domain: "financial-projection",
      analysisYear,
      schoolCodeStd,
      fileName: "report.pdf",
    });
  }
}

export async function saveFpReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
  pdf: Buffer,
  meta: FpReportMeta,
): Promise<FpReportMeta> {
  const nextMeta: FpReportMeta = {
    ...meta,
    pdfFile: "report.pdf",
    pdfGeneratedAt: new Date().toISOString(),
  };
  try {
    await writeFile(fpReportPdfPath(analysisYear, schoolCodeStd), pdf);
    await writeFile(
      fpReportMetaPath(analysisYear, schoolCodeStd),
      JSON.stringify(nextMeta, null, 2),
      "utf8",
    );
  } catch {
    /* read-only FS */
  }
  await putReportBinaryFile({
    domain: "financial-projection",
    analysisYear,
    schoolCodeStd,
    fileName: "report.pdf",
    content: pdf,
  });
  await putReportTextFile({
    domain: "financial-projection",
    analysisYear,
    schoolCodeStd,
    fileName: "meta.json",
    content: JSON.stringify(nextMeta, null, 2),
  });
  return nextMeta;
}

export async function listFpReportsForYear(
  analysisYear: number,
): Promise<FpReportMeta[]> {
  const yearDir = path.join(REPORTS_ROOT, String(analysisYear));
  let entries: string[] = [];
  try {
    entries = await readdir(yearDir);
  } catch {
    entries = [];
  }

  const metas: FpReportMeta[] = [];
  for (const schoolCodeStd of entries) {
    const meta = await loadFpReportMeta(analysisYear, schoolCodeStd);
    if (meta) metas.push(meta);
  }

  const remoteCodes = await listReportSchoolCodes({
    domain: "financial-projection",
    analysisYear,
  });
  for (const schoolCodeStd of remoteCodes) {
    if (metas.some((meta) => meta.schoolCodeStd === schoolCodeStd)) continue;
    const meta = await loadFpReportMeta(analysisYear, schoolCodeStd);
    if (meta) metas.push(meta);
  }

  return metas.sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName, "ko"),
  );
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
