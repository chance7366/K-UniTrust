import fs from "fs";
import * as XLSX from "xlsx";

import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import { parseAoaToSheet } from "@/lib/analysis/freshman-enrollment-alimi/row-utils";
import type { FreshmanEnrollmentAlimiMockData } from "@/lib/analysis/freshman-enrollment-alimi/types";
import { loadSchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";

export const FRESHMAN_ENROLLMENT_UNDERGRAD_XLSX =
  "d:/바이브코딩/데이터관리/대학알리미/신입생충원/(업로드)신입생충원_대학전문.xlsx";

export const FRESHMAN_ENROLLMENT_GRAD_XLSX =
  "d:/바이브코딩/데이터관리/대학알리미/신입생충원/(업로드)신입생충원_대학원.xlsx";

function readMerges(sheet: XLSX.WorkSheet): HeaderMergeRange[] | undefined {
  const merges = sheet["!merges"];
  if (!merges?.length) return undefined;
  return merges
    .filter((m) => m.s.r < 3)
    .map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));
}

function parseSheetFile(
  filePath: string,
  kind: "undergrad" | "grad",
  label: string,
  lookup: Awaited<ReturnType<typeof loadSchoolDivisionLookup>>,
) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const parsed = parseAoaToSheet(aoa, kind, lookup);
  return {
    kind,
    label,
    fileName: filePath.split(/[/\\]/).pop() ?? filePath,
    headerRows: parsed.headerRows,
    headerMerges: readMerges(sheet),
    rows: parsed.rows,
    columnCount: parsed.columnCount,
    years: parsed.years,
    uploadedAt: null,
    rowCount: parsed.rows.length,
  };
}

export async function loadFreshmanEnrollmentAlimiMockData(): Promise<FreshmanEnrollmentAlimiMockData> {
  const lookup = await loadSchoolDivisionLookup();
  return {
    undergrad: parseSheetFile(
      FRESHMAN_ENROLLMENT_UNDERGRAD_XLSX,
      "undergrad",
      "대학전문",
      lookup,
    ),
    grad: parseSheetFile(
      FRESHMAN_ENROLLMENT_GRAD_XLSX,
      "grad",
      "대학원",
      lookup,
    ),
  };
}
