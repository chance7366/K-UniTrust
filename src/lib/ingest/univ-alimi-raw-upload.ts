import * as XLSX from "xlsx";

import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import {
  buildRowMeta,
  cleanCell,
  detectHeaderRowCount,
  normalizeRow,
  parseAoaToSheet,
  parseYearText,
} from "@/lib/analysis/univ-alimi-raw/row-utils";
import { getUnivAlimiCol } from "@/lib/analysis/univ-alimi-raw/screens";
import type {
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
} from "@/lib/analysis/univ-alimi-raw/types";
import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  UNIV_ALIMI_BRONZE_ID,
  UNIV_ALIMI_CSV_COLUMNS,
  UNIV_ALIMI_CSV_KEY,
  validateUnivAlimiHeaderRow0,
} from "@/lib/ingest/univ-alimi-raw-config";
import {
  readUnivAlimiRawMeta,
  writeUnivAlimiRawMeta,
} from "@/lib/ingest/univ-alimi-raw-meta";

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
): { aoa: unknown[][]; rawMerges?: XLSX.Range[] } {
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

  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName =
    wb.SheetNames.find((n) => n === "Sheet1") ?? wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
  return {
    aoa: XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }),
    rawMerges: sheet["!merges"],
  };
}

function csvRecordFromRow(
  row: ReturnType<typeof buildRowMeta>,
  cols: { status: number },
  uploadedAt: string,
): Record<string, string> {
  return {
    year_text: row.yearText,
    school_code_std: row.schoolCodeStd,
    school_kind: row.schoolKind,
    estb: row.estb,
    region: row.region,
    status: row.cells[cols.status] ?? "",
    school_name: row.schoolName,
    cells_json: JSON.stringify(row.cells),
    uploaded_at: uploadedAt,
  };
}

export type UnivAlimiRawUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestUnivAlimiRawUpload(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
  buffer: Buffer,
  fileName: string,
): Promise<UnivAlimiRawUploadResult> {
  const { aoa, rawMerges } = sheetFromBuffer(buffer, fileName);
  const headerRowCount = detectHeaderRowCount(aoa);
  if (aoa.length < headerRowCount + 1) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  const headerRows = aoa
    .slice(0, headerRowCount)
    .map((row) =>
      normalizeRow(
        row ?? [],
        Math.max(
          ...aoa.slice(0, headerRowCount).map((r) => (r ?? []).length),
          0,
        ),
      ),
    );
  validateUnivAlimiHeaderRow0(kind, headerRows[0] ?? []);

  const parsed = parseAoaToSheet(aoa, indicator, kind, null);
  if (parsed.rows.length === 0) {
    throw new Error("유효한 데이터 행이 없습니다.");
  }

  const uploadedAt = new Date().toISOString();
  const uploadYears = new Set(
    parsed.rows.map((r) => r.year).filter((y): y is number => y != null),
  );

  const csvKey = UNIV_ALIMI_CSV_KEY[indicator][kind];
  const bronzeId = UNIV_ALIMI_BRONZE_ID[indicator][kind];
  if (!csvKey || !bronzeId) {
    throw new Error("이 지표는 해당 구분을 지원하지 않습니다.");
  }
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

  const cols = getUnivAlimiCol(indicator, kind);
  const newRecords = parsed.rows.map((row) =>
    csvRecordFromRow(row, cols, uploadedAt),
  );
  const merged = [...kept, ...newRecords];

  await writeCsvFile(csvKey, merged, [...UNIV_ALIMI_CSV_COLUMNS]);

  await writeUnivAlimiRawMeta(indicator, kind, {
    headerRows: parsed.headerRows,
    headerMerges: normalizeMerges(rawMerges, parsed.headerRowCount),
    columnCount: parsed.columnCount,
    uploadedAt,
    fileName,
  });

  const overwrittenYears = [...uploadYears]
    .filter((y) => existingYearSet.has(y))
    .sort((a, b) => a - b);
  const newYears = [...uploadYears]
    .filter((y) => !existingYearSet.has(y))
    .sort((a, b) => a - b);

  const bronzePath = await writeBronzeSnapshot({
    domainId: "univ-map",
    submenuId: bronzeId,
    rows: merged,
  });

  return {
    rowCount: parsed.rows.length,
    years: [...uploadYears].sort((a, b) => a - b),
    overwrittenYears,
    newYears,
    bronzePath,
  };
}

function writeWorkbook(
  aoa: string[][],
  merges?: HeaderMergeRange[],
): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (merges?.length) {
    ws["!merges"] = merges.map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

export async function buildUnivAlimiRawTemplateBuffer(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): Promise<Buffer> {
  const meta = await readUnivAlimiRawMeta(indicator, kind);
  if (!meta?.headerRows?.length) {
    throw new Error(
      "저장된 양식이 없습니다. 먼저 해당 구분의 엑셀을 업로드하세요.",
    );
  }
  return writeWorkbook(
    meta.headerRows.map((row) => [...row]),
    meta.headerMerges,
  );
}

export async function buildUnivAlimiRawExportBuffer(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): Promise<Buffer> {
  const meta = await readUnivAlimiRawMeta(indicator, kind);
  if (!meta?.headerRows?.length) {
    throw new Error("저장된 헤더가 없습니다. 먼저 데이터를 업로드하세요.");
  }

  const csvKey = UNIV_ALIMI_CSV_KEY[indicator][kind];
  if (!csvKey) {
    throw new Error("이 지표는 해당 구분을 지원하지 않습니다.");
  }
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
  return writeWorkbook(aoa, meta.headerMerges);
}
