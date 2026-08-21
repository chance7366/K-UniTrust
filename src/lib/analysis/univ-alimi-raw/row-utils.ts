import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";
import type { SchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";

import { getUnivAlimiCol } from "./screens";
import type {
  UnivAlimiColMap,
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
  UnivAlimiRawRow,
} from "./types";

export function normalizeSchoolCodeText(value: string): string {
  const text = value.trim();
  if (!text) return "";
  if (/^\d+$/.test(text) && text.length < 7) {
    return text.padStart(7, "0");
  }
  return text;
}

export function cleanCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v) && Number.isInteger(v)) {
    return String(v);
  }
  return String(v)
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeRow(row: unknown[], width: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < width; i++) {
    out.push(cleanCell(row[i]));
  }
  return out;
}

export function parseYearText(v: string): number | null {
  const m = v.match(/(\d{4})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1900 ? n : null;
}

export function detectHeaderRowCount(aoa: unknown[][]): number {
  const limit = Math.min(aoa.length, 12);
  for (let i = 1; i < limit; i++) {
    const first = cleanCell((aoa[i] ?? [])[0]);
    if (/^\d{4}/.test(first)) return i;
  }
  return 3;
}

function resolveSchoolDivision(
  lookup: SchoolDivisionLookup | null,
  year: number | null,
  schoolCodeStd: string,
  schoolKind: string,
): string {
  if (lookup && year && schoolCodeStd) {
    const fromDb = lookup.lookupByStd(year, schoolCodeStd);
    if (fromDb) return fromDb;
  }
  return resolveSchoolDivisionFromFields(schoolKind, "") ?? "";
}

export function buildRowMeta(
  cells: string[],
  cols: UnivAlimiColMap,
  lookup: SchoolDivisionLookup | null,
): UnivAlimiRawRow {
  const yearText = cells[cols.year] ?? "";
  const year = parseYearText(yearText);
  const schoolCodeStd = normalizeSchoolCodeText(cells[cols.schoolCode] ?? "");
  if (schoolCodeStd && schoolCodeStd !== cells[cols.schoolCode]) {
    cells[cols.schoolCode] = schoolCodeStd;
  }
  const schoolKind = cells[cols.schoolKind] ?? "";
  const estb = cells[cols.estb] ?? "";
  const region = cells[cols.region] ?? "";
  const nameParts = [
    cols.schoolName != null ? cells[cols.schoolName] : "",
    cols.gradName != null ? cells[cols.gradName] : "",
  ].filter(Boolean);
  const schoolName = nameParts.join(" · ");

  return {
    cells,
    year,
    yearText,
    schoolCodeStd,
    schoolKind,
    estb,
    region,
    schoolDivision: resolveSchoolDivision(
      lookup,
      year,
      schoolCodeStd,
      schoolKind,
    ),
    schoolName,
  };
}

export function parseAoaToSheet(
  aoa: unknown[][],
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
  lookup: SchoolDivisionLookup | null,
): {
  headerRows: string[][];
  rows: UnivAlimiRawRow[];
  columnCount: number;
  years: number[];
  headerRowCount: number;
} {
  const headerRowCount = detectHeaderRowCount(aoa);
  const columnCount = Math.max(
    ...aoa.slice(0, headerRowCount).map((row) => (row ?? []).length),
    0,
  );
  const headerRows = aoa
    .slice(0, headerRowCount)
    .map((row) => normalizeRow(row ?? [], columnCount));
  const cols = getUnivAlimiCol(indicator, kind);

  const rows: UnivAlimiRawRow[] = [];
  const yearSet = new Set<number>();

  for (const row of aoa.slice(headerRowCount)) {
    const cells = normalizeRow(row ?? [], columnCount);
    if (!cells.some((c) => c !== "")) continue;
    const parsed = buildRowMeta(cells, cols, lookup);
    rows.push(parsed);
    if (parsed.year) yearSet.add(parsed.year);
  }

  return {
    headerRows,
    rows,
    columnCount,
    years: [...yearSet].sort((a, b) => b - a),
    headerRowCount,
  };
}
