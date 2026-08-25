import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import path from "path";

import {
  getReportBinaryFile,
  getReportTextFile,
  isBlobReportStorageEnabled,
  listReportSchoolCodes,
  putReportBinaryFile,
  putReportTextFile,
} from "@/lib/reports/blob-report-storage";
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
  const generatedAt = new Date().toISOString();
  const htmlFile = "report.html";
  const meta: UniversityReportMeta = {
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    schoolName: args.schoolName,
    generatedAt,
    model: args.model,
    guidelinesVersion: UNIVERSITY_REPORT_GUIDELINES_VERSION,
    htmlFile,
  };
  const metaJson = JSON.stringify(meta, null, 2);

  let savedLocally = false;
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, htmlFile), args.html, "utf8");
    await writeFile(path.join(dir, "meta.json"), metaJson, "utf8");
    savedLocally = true;
  } catch {
    /* Vercel serverless FS is read-only */
  }

  await putReportTextFile({
    domain: "competitiveness",
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    fileName: "report.html",
    content: args.html,
  });
  await putReportTextFile({
    domain: "competitiveness",
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    fileName: "meta.json",
    content: metaJson,
  });

  if (!savedLocally && !isBlobReportStorageEnabled()) {
    throw new Error(
      "보고서를 저장할 수 없습니다. Vercel에 BLOB_READ_WRITE_TOKEN을 설정하세요.",
    );
  }

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
    const remote = await getReportTextFile({
      domain: "competitiveness",
      analysisYear,
      schoolCodeStd,
      fileName: "meta.json",
    });
    if (!remote) return null;
    try {
      return JSON.parse(remote) as UniversityReportMeta;
    } catch {
      return null;
    }
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
    return getReportTextFile({
      domain: "competitiveness",
      analysisYear,
      schoolCodeStd,
      fileName: "report.html",
    });
  }
}

export async function loadUniversityReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer | null> {
  try {
    return await readFile(
      universityReportPdfPath(analysisYear, schoolCodeStd),
    );
  } catch {
    return getReportBinaryFile({
      domain: "competitiveness",
      analysisYear,
      schoolCodeStd,
      fileName: "report.pdf",
    });
  }
}

export async function saveUniversityReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
  pdf: Buffer,
  meta: UniversityReportMeta,
): Promise<UniversityReportMeta> {
  const nextMeta: UniversityReportMeta = {
    ...meta,
    pdfFile: "report.pdf",
    pdfGeneratedAt: new Date().toISOString(),
  };
  try {
    await writeFile(
      universityReportPdfPath(analysisYear, schoolCodeStd),
      pdf,
    );
    await writeFile(
      universityReportMetaPath(analysisYear, schoolCodeStd),
      JSON.stringify(nextMeta, null, 2),
      "utf8",
    );
  } catch {
    /* read-only FS */
  }
  await putReportBinaryFile({
    domain: "competitiveness",
    analysisYear,
    schoolCodeStd,
    fileName: "report.pdf",
    content: pdf,
  });
  await putReportTextFile({
    domain: "competitiveness",
    analysisYear,
    schoolCodeStd,
    fileName: "meta.json",
    content: JSON.stringify(nextMeta, null, 2),
  });
  return nextMeta;
}

export async function listUniversityReportsForYear(
  analysisYear: number,
): Promise<UniversityReportMeta[]> {
  const yearDir = path.join(REPORTS_ROOT, String(analysisYear));
  let entries: string[] = [];
  try {
    entries = await readdir(yearDir);
  } catch {
    entries = [];
  }

  const metas: UniversityReportMeta[] = [];
  for (const schoolCodeStd of entries) {
    const meta = await loadUniversityReportMeta(analysisYear, schoolCodeStd);
    if (meta) metas.push(meta);
  }

  const remoteCodes = await listReportSchoolCodes({
    domain: "competitiveness",
    analysisYear,
  });
  for (const schoolCodeStd of remoteCodes) {
    if (metas.some((meta) => meta.schoolCodeStd === schoolCodeStd)) continue;
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
