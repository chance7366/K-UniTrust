import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  ANALYSIS_TARGET_CSV_COLUMNS,
  ANALYSIS_TARGET_TEMPLATE_HEADER,
  ANALYSIS_TARGET_TEMPLATE_SAMPLES,
  ANALYSIS_TARGET_TEXT_COLUMNS,
  padAnalysisTargetSchoolCode,
  validateAnalysisTargetHeader,
} from "@/lib/ingest/analysis-target-config";

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function sheetToAoa(buffer: Buffer, fileName: string): unknown[][] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]!];
    return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
  }

  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName =
    wb.SheetNames.find((n) => n === "Sheet1") ??
    wb.SheetNames.find((n) => n === "Sheet2") ??
    wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
}

function parseRows(
  aoa: unknown[][],
  uploadedAt: string,
): Record<string, string>[] {
  if (aoa.length < 2) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  validateAnalysisTargetHeader(aoa[0] ?? []);

  const parsed: Record<string, string>[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const schoolCodeStd = s(row[1]);
    const schoolName = s(row[2]);
    if (!year || !schoolCodeStd || !schoolName) continue;

    parsed.push({
      year: String(year),
      school_code_std: padAnalysisTargetSchoolCode(schoolCodeStd),
      school_name: schoolName,
      main_branch_name: s(row[3]),
      school_division: s(row[4]),
      school_rep_code: padAnalysisTargetSchoolCode(s(row[5])),
      school_rep_name: s(row[6]),
      school_kind: s(row[7]),
      region: s(row[8]),
      estb: s(row[9]),
      related_law: s(row[10]),
      corp_name: s(row[11]),
      status: s(row[12]),
      parent_school_name: s(row[13]),
      student_aid_restrict: s(row[14]),
      provisional_board: s(row[15]),
      no_settlement: s(row[16]),
      uploaded_at: uploadedAt,
    });
  }

  return parsed;
}

export type AnalysisTargetUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestAnalysisTargetUpload(
  buffer: Buffer,
  fileName: string,
): Promise<AnalysisTargetUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",
    );
  }

  const uploadYears = [
    ...new Set(parsed.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = await readCsvFile("univMapAnalysisTarget").catch(() => []);
  const existingYears = new Set(
    existing.map((r) => Number(r.year)).filter(Number.isFinite),
  );

  const overwrittenYears = uploadYears.filter((y) => existingYears.has(y));
  const newYears = uploadYears.filter((y) => !existingYears.has(y));

  const uploadYearSet = new Set(uploadYears.map(String));
  const kept = existing.filter((r) => !uploadYearSet.has(r.year));
  const merged = [...kept, ...parsed];

  await writeCsvFile(
    "univMapAnalysisTarget",
    merged,
    [...ANALYSIS_TARGET_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "univ-map",
    submenuId: "analysis-target",
    rows: parsed,
  });

  return {
    rowCount: parsed.length,
    years: uploadYears,
    overwrittenYears,
    newYears,
    bronzePath,
  };
}

function templateSampleToRow(
  row: (typeof ANALYSIS_TARGET_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return ANALYSIS_TARGET_TEMPLATE_HEADER.map(
    (key) => row[key as keyof typeof row],
  );
}

function applySchoolCodeTextFormat(ws: XLSX.WorkSheet, rowCount: number) {
  const textCols = ANALYSIS_TARGET_TEXT_COLUMNS.map((label) =>
    ANALYSIS_TARGET_TEMPLATE_HEADER.indexOf(label),
  ).filter((i) => i >= 0);

  for (let r = 1; r < rowCount; r++) {
    for (const c of textCols) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) continue;
      cell.t = "s";
      cell.z = "@";
      cell.v = padAnalysisTargetSchoolCode(String(cell.v ?? ""));
    }
  }
}

function writeAnalysisTargetXlsx(aoa: (string | number)[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  applySchoolCodeTextFormat(ws, aoa.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

export function buildAnalysisTargetTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...ANALYSIS_TARGET_TEMPLATE_HEADER],
    ...ANALYSIS_TARGET_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];
  return writeAnalysisTargetXlsx(aoa);
}

export function buildAnalysisTargetWorkbookBuffer(
  aoa: (string | number)[][],
): Buffer {
  return writeAnalysisTargetXlsx(aoa);
}
