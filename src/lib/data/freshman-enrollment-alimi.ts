import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import {
  FRESHMAN_ENROLLMENT_ALIMI_LABEL,
  FRESHMAN_ENROLLMENT_ALIMI_COL,
} from "@/lib/analysis/freshman-enrollment-alimi/column-map";
import {
  buildRowMeta,
  normalizeSchoolCodeText,
  parseYearText,
} from "@/lib/analysis/freshman-enrollment-alimi/row-utils";
import type {
  FreshmanEnrollmentAlimiDashboardData,
  FreshmanEnrollmentAlimiQuery,
  FreshmanEnrollmentDatasetKind,
  RawEnrollmentRow,
  RawEnrollmentSheet,
} from "@/lib/analysis/freshman-enrollment-alimi/types";
import {
  parseMultiFilterParam,
  rowMatchesTableFilters,
} from "@/lib/analysis/table-filter-utils";
import type { CsvFileKey } from "@/lib/csv/paths";
import { readCsvFile } from "@/lib/csv/read";
import {
  getOrCreateYearSliceCache,
  loadYearSlice,
} from "@/lib/csv/year-slice-cache";
import { FRESHMAN_ENROLLMENT_ALIMI_CSV_KEY } from "@/lib/ingest/freshman-enrollment-alimi-config";
import { readFreshmanEnrollmentAlimiMeta } from "@/lib/ingest/freshman-enrollment-alimi-meta";
import { loadSchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";
import type { SchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function emptySheet(kind: FreshmanEnrollmentDatasetKind): RawEnrollmentSheet {
  return {
    kind,
    label: FRESHMAN_ENROLLMENT_ALIMI_LABEL[kind],
    fileName: `${FRESHMAN_ENROLLMENT_ALIMI_LABEL[kind]}.xlsx`,
    headerRows: [],
    rows: [],
    columnCount: 0,
    years: [],
    uploadedAt: null,
    rowCount: 0,
  };
}

function yearOf(r: Record<string, string>): number | null {
  return parseYearText(r.year_text ?? "");
}

function parseCsvRecord(
  r: Record<string, string>,
  kind: FreshmanEnrollmentDatasetKind,
  lookup: SchoolDivisionLookup | null,
): RawEnrollmentRow | null {
  let cells: string[] = [];
  try {
    cells = JSON.parse(r.cells_json ?? "[]") as string[];
  } catch {
    return null;
  }
  const parsed = buildRowMeta(cells, kind, lookup);
  parsed.yearText = r.year_text ?? parsed.yearText;
  parsed.schoolCodeStd = normalizeSchoolCodeText(
    r.school_code_std ?? parsed.schoolCodeStd,
  );
  const codeCol = FRESHMAN_ENROLLMENT_ALIMI_COL[kind].schoolCode;
  if (parsed.cells[codeCol] !== parsed.schoolCodeStd) {
    parsed.cells[codeCol] = parsed.schoolCodeStd;
  }
  parsed.schoolKind = r.school_kind ?? parsed.schoolKind;
  parsed.estb = r.estb ?? parsed.estb;
  parsed.region = r.region ?? parsed.region;
  parsed.schoolName = r.school_name ?? parsed.schoolName;
  return parsed;
}

function loadYearRows(
  csvKey: CsvFileKey,
  kind: FreshmanEnrollmentDatasetKind,
  csvRows: Record<string, string>[],
  year: number,
  lookup: SchoolDivisionLookup | null,
): RawEnrollmentRow[] {
  const cache = getOrCreateYearSliceCache<RawEnrollmentRow>(
    `${csvKey}:${kind}`,
    csvKey,
    csvRows,
    yearOf,
  );
  return loadYearSlice(cache, year, () => {
    const rows: RawEnrollmentRow[] = [];
    for (const r of csvRows) {
      if (yearOf(r) !== year) continue;
      const parsed = parseCsvRecord(r, kind, lookup);
      if (parsed) rows.push(parsed);
    }
    return rows;
  });
}

async function loadSheetMeta(
  kind: FreshmanEnrollmentDatasetKind,
): Promise<{ sheet: RawEnrollmentSheet; csvKey: CsvFileKey }> {
  const csvKey = FRESHMAN_ENROLLMENT_ALIMI_CSV_KEY[kind];
  const [csvRows, meta] = await Promise.all([
    readCsvFile(csvKey).catch(() => []),
    readFreshmanEnrollmentAlimiMeta(kind),
  ]);
  const cache = getOrCreateYearSliceCache<RawEnrollmentRow>(
    `${csvKey}:${kind}`,
    csvKey,
    csvRows,
    yearOf,
  );
  let latestUploadedAt: string | null = meta?.uploadedAt ?? null;
  for (const r of csvRows) {
    if (r.uploaded_at && (!latestUploadedAt || r.uploaded_at > latestUploadedAt)) {
      latestUploadedAt = r.uploaded_at;
    }
  }

  return {
    csvKey,
    sheet: {
      kind,
      label: FRESHMAN_ENROLLMENT_ALIMI_LABEL[kind],
      fileName: meta?.fileName ?? `${FRESHMAN_ENROLLMENT_ALIMI_LABEL[kind]}.xlsx`,
      headerRows: meta?.headerRows ?? [],
      headerMerges: meta?.headerMerges,
      rows: [],
      columnCount: meta?.columnCount ?? 0,
      years: cache.years,
      uploadedAt: latestUploadedAt,
      rowCount: csvRows.length,
    },
  };
}

export async function loadFreshmanEnrollmentAlimiDashboard(
  query: FreshmanEnrollmentAlimiQuery,
): Promise<FreshmanEnrollmentAlimiDashboardData> {
  const lookup = await loadSchoolDivisionLookup();
  const [undergradLoaded, gradLoaded] = await Promise.all([
    loadSheetMeta("undergrad"),
    loadSheetMeta("grad"),
  ]);

  const dataset =
    query.dataset === "grad" || query.dataset === "undergrad"
      ? query.dataset
      : "undergrad";
  const activeLoaded =
    dataset === "undergrad" ? undergradLoaded : gradLoaded;
  const activeSheet = activeLoaded.sheet;

  const displayYear =
    query.year != null
      ? query.year
      : (activeSheet.years[0] ?? null);

  const estbFilter = query.estb?.trim() ?? "";
  const schoolDivisionFilter = query.schoolDivision?.trim() ?? "";
  const schoolKindsFilter = parseMultiFilterParam(query.schoolKind);
  const regionsFilter = parseMultiFilterParam(query.region);
  const searchFilter = query.search?.trim() ?? "";

  let yearRows: RawEnrollmentRow[] = [];
  if (displayYear != null) {
    const csvRows = await readCsvFile(activeLoaded.csvKey).catch(() => []);
    yearRows = loadYearRows(
      activeLoaded.csvKey,
      dataset,
      csvRows,
      displayYear,
      lookup,
    );
  }

  const estbs = new Set<string>();
  const schoolDivisions = new Set<string>();
  const regions = new Set<string>();

  for (const row of yearRows) {
    if (row.estb) estbs.add(row.estb);
    if (row.schoolDivision) schoolDivisions.add(row.schoolDivision);
    if (row.region) regions.add(row.region);
  }

  const filteredRows = yearRows
    .filter((row) =>
      rowMatchesTableFilters(row, {
        estb: estbFilter,
        schoolDivision: schoolDivisionFilter,
        schoolKinds: schoolKindsFilter,
        regions: regionsFilter,
        search: searchFilter,
      }),
    )
    .sort(
      (a, b) =>
        a.schoolName.localeCompare(b.schoolName, "ko") ||
        a.schoolCodeStd.localeCompare(b.schoolCodeStd, "ko"),
    );

  return {
    dataset,
    undergrad: undergradLoaded.sheet,
    grad: gradLoaded.sheet,
    displayYear,
    filteredRows,
    filterOptions: {
      estbs: sortKo([...estbs]),
      schoolDivisions: sortKo([...schoolDivisions]),
      schoolKinds: getTableSchoolKindOptions(
        yearRows,
        estbFilter,
        schoolDivisionFilter,
      ),
      regions: sortKo([...regions]),
    },
    filters: {
      estb: estbFilter,
      schoolDivision: schoolDivisionFilter,
      schoolKinds: schoolKindsFilter,
      regions: regionsFilter,
      search: searchFilter,
    },
    hasData: undergradLoaded.sheet.rowCount > 0 || gradLoaded.sheet.rowCount > 0,
  };
}

export function parseFreshmanEnrollmentAlimiQuery(
  searchParams: Record<string, string | string[] | undefined>,
): FreshmanEnrollmentAlimiQuery {
  const sp = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };

  const yearRaw = sp("year");
  const year = yearRaw ? Number(yearRaw) : undefined;

  const datasetRaw = sp("dataset");
  const dataset =
    datasetRaw === "grad" || datasetRaw === "undergrad"
      ? datasetRaw
      : undefined;

  return {
    dataset,
    year: Number.isFinite(year) ? year : undefined,
    estb: sp("estb"),
    schoolDivision: sp("schoolDivision"),
    schoolKind: sp("schoolKind"),
    region: sp("region"),
    search: sp("search"),
  };
}
