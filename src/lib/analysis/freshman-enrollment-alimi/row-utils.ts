import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";
import type { SchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";

import { FRESHMAN_ENROLLMENT_ALIMI_COL as COL } from "./column-map";
import type {
  FreshmanEnrollmentDatasetKind,
  RawEnrollmentRow,
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
  const n = Number(v);
  return Number.isFinite(n) && n >= 1900 ? n : null;
}

export function resolveSchoolDivision(
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
  kind: FreshmanEnrollmentDatasetKind,
  lookup: SchoolDivisionLookup | null,
): RawEnrollmentRow {
  const cols = COL[kind];
  const yearText = cells[cols.year] ?? "";
  const year = parseYearText(yearText);
  const schoolCodeStd = normalizeSchoolCodeText(cells[cols.schoolCode] ?? "");
  if (schoolCodeStd !== cells[cols.schoolCode]) {
    cells[cols.schoolCode] = schoolCodeStd;
  }
  const schoolKind = cells[cols.schoolKind] ?? "";
  const estb = cells[cols.estb] ?? "";
  const region = cells[cols.region] ?? "";
  const schoolName =
    kind === "grad"
      ? [cells[COL.grad.schoolRep], cells[COL.grad.gradName]]
          .filter(Boolean)
          .join(" · ")
      : (cells[COL.undergrad.schoolName] ?? "");

  const schoolDivision = resolveSchoolDivision(
    lookup,
    year,
    schoolCodeStd,
    schoolKind,
  );

  return {
    cells,
    year,
    yearText,
    schoolCodeStd,
    schoolKind,
    estb,
    region,
    schoolDivision,
    schoolName,
  };
}

export function parseAoaToSheet(
  aoa: unknown[][],
  kind: FreshmanEnrollmentDatasetKind,
  lookup: SchoolDivisionLookup | null,
  options?: { fileName?: string; uploadedAt?: string | null },
): {
  headerRows: string[][];
  rows: RawEnrollmentRow[];
  columnCount: number;
  years: number[];
} {
  const columnCount = Math.max(
    ...aoa.slice(0, 3).map((row) => (row ?? []).length),
    0,
  );
  const headerRows = aoa
    .slice(0, 3)
    .map((row) => normalizeRow(row ?? [], columnCount));

  const rows: RawEnrollmentRow[] = [];
  const yearSet = new Set<number>();

  for (const row of aoa.slice(3)) {
    const cells = normalizeRow(row ?? [], columnCount);
    const hasContent = cells.some((c) => c !== "");
    if (!hasContent) continue;

    const parsed = buildRowMeta(cells, kind, lookup);
    rows.push(parsed);
    if (parsed.year) yearSet.add(parsed.year);
  }

  return {
    headerRows,
    rows,
    columnCount,
    years: [...yearSet].sort((a, b) => b - a),
  };
}
