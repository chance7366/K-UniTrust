import * as XLSX from "xlsx";

import {
  buildRowMeta,
  cleanCell,
  normalizeRow,
  parseAoaToSheet,
  parseYearText,
} from "@/lib/analysis/freshman-enrollment-alimi/row-utils";
import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";
import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  FRESHMAN_ENROLLMENT_ALIMI_BRONZE_ID,
  FRESHMAN_ENROLLMENT_ALIMI_CSV_COLUMNS,
  FRESHMAN_ENROLLMENT_ALIMI_CSV_KEY,
  validateAlimiHeaderRow0,
} from "@/lib/ingest/freshman-enrollment-alimi-config";
import {
  readFreshmanEnrollmentAlimiMeta,
  writeFreshmanEnrollmentAlimiMeta,
} from "@/lib/ingest/freshman-enrollment-alimi-meta";

function normalizeMerges(
  merges: XLSX.Range[] | undefined,
  headerRowCount: number,
): HeaderMergeRange[] | undefined {
  if (!merges?.length) return undefined;
  return merges
    .filter((m) => m.s.r < headerRowCount)
    .map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));
}

function sheetFromBuffer(
  buffer: Buffer,
  fileName: string,
): { aoa: unknown[][]; merges?: HeaderMergeRange[] } {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]!]!;
    return {
      aoa: XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: false,
      }),
    };
  }

  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => n === "Sheet1") ?? wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
  return {
    aoa: XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }),
    merges: normalizeMerges(sheet["!merges"], 3),
  };
}

function csvRecordFromRow(
  row: ReturnType<typeof buildRowMeta>,
  kind: FreshmanEnrollmentDatasetKind,
  uploadedAt: string,
): Record<string, string> {
  const cols = row.cells;
  const statusCol = kind === "grad" ? 7 : 5;
  return {
    year_text: row.yearText,
    school_code_std: row.schoolCodeStd,
    school_kind: row.schoolKind,
    estb: row.estb,
    region: row.region,
    status: cols[statusCol] ?? "",
    school_name: row.schoolName,
    cells_json: JSON.stringify(row.cells),
    uploaded_at: uploadedAt,
  };
}

export type FreshmanEnrollmentAlimiUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestFreshmanEnrollmentAlimiUpload(
  kind: FreshmanEnrollmentDatasetKind,
  buffer: Buffer,
  fileName: string,
): Promise<FreshmanEnrollmentAlimiUploadResult> {
  const { aoa, merges } = sheetFromBuffer(buffer, fileName);
  if (aoa.length < 4) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  const headerRows = aoa
    .slice(0, 3)
    .map((row) => normalizeRow(row ?? [], Math.max(...aoa.slice(0, 3).map((r) => (r ?? []).length), 0)));
  validateAlimiHeaderRow0(kind, headerRows[0] ?? []);

  const parsed = parseAoaToSheet(aoa, kind, null);
  if (parsed.rows.length === 0) {
    throw new Error("유효한 데이터 행이 없습니다.");
  }

  const uploadedAt = new Date().toISOString();
  const uploadYears = new Set(
    parsed.rows.map((r) => r.year).filter((y): y is number => y != null),
  );
  if (uploadYears.size === 0) {
    throw new Error(
      "엑셀에서 기준연도를 읽지 못했습니다. 첫 번째 열에 2026 또는 2026학년도처럼 연도가 있는지 확인하세요.",
    );
  }

  const csvKey = FRESHMAN_ENROLLMENT_ALIMI_CSV_KEY[kind];
  const existing = await readCsvFile(csvKey).catch(() => []);
  const existingYearSet = new Set(
    existing
      .map((r) => parseYearText(r.year_text ?? ""))
      .filter((y): y is number => y != null),
  );
  const kept = existing.filter((r) => {
    const year = parseYearText(r.year_text ?? "");
    return year == null || !uploadYears.has(year);
  });

  const newRecords = parsed.rows.map((row) =>
    csvRecordFromRow(row, kind, uploadedAt),
  );
  const merged = [...kept, ...newRecords];

  await writeCsvFile(
    csvKey,
    merged,
    [...FRESHMAN_ENROLLMENT_ALIMI_CSV_COLUMNS],
  );

  await writeFreshmanEnrollmentAlimiMeta(kind, {
    headerRows: parsed.headerRows,
    headerMerges: merges,
    columnCount: parsed.columnCount,
    uploadedAt,
    fileName,
  });

  const overwrittenYears = [...uploadYears].filter((y) =>
    existingYearSet.has(y),
  );
  const newYears = [...uploadYears].filter((y) => !existingYearSet.has(y));

  const bronzePath = await writeBronzeSnapshot({
    domainId: "finance-analysis",
    submenuId: FRESHMAN_ENROLLMENT_ALIMI_BRONZE_ID[kind],
    rows: merged,
  });

  return {
    rowCount: merged.length,
    years: [...uploadYears].sort((a, b) => a - b),
    overwrittenYears: overwrittenYears.sort((a, b) => a - b),
    newYears: newYears.sort((a, b) => a - b),
    bronzePath,
  };
}

export async function buildFreshmanEnrollmentAlimiTemplateBuffer(
  kind: FreshmanEnrollmentDatasetKind,
): Promise<Buffer> {
  const meta = await readFreshmanEnrollmentAlimiMeta(kind);
  const headerRows = meta?.headerRows;
  if (!headerRows?.length) {
    throw new Error(
      "저장된 양식이 없습니다. 먼저 해당 구분의 엑셀을 업로드하세요.",
    );
  }

  const aoa: string[][] = headerRows.map((row) => [...row]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (meta?.headerMerges?.length) {
    ws["!merges"] = meta.headerMerges.map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

export async function buildFreshmanEnrollmentAlimiExportBuffer(
  kind: FreshmanEnrollmentDatasetKind,
): Promise<Buffer> {
  const meta = await readFreshmanEnrollmentAlimiMeta(kind);
  if (!meta?.headerRows?.length) {
    throw new Error("저장된 헤더가 없습니다. 먼저 데이터를 업로드하세요.");
  }

  const csvKey = FRESHMAN_ENROLLMENT_ALIMI_CSV_KEY[kind];
  const rows = await readCsvFile(csvKey).catch(() => []);
  if (rows.length === 0) {
    throw new Error("저장된 데이터가 없습니다.");
  }

  const aoa: string[][] = meta.headerRows.map((row) => [...row]);
  for (const row of rows) {
    try {
      const cells = JSON.parse(row.cells_json ?? "[]") as string[];
      aoa.push(cells.map((c) => cleanCell(c)));
    } catch {
      continue;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (meta.headerMerges?.length) {
    ws["!merges"] = meta.headerMerges.map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
