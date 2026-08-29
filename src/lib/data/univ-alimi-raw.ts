import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import {
  parseMultiFilterParam,
  rowMatchesTableFilters,
} from "@/lib/analysis/table-filter-utils";
import {
  getUnivAlimiDatasets,
  UNIV_ALIMI_COL,
  UNIV_ALIMI_DATASET_LABEL,
} from "@/lib/analysis/univ-alimi-raw/screens";
import {
  buildRowMeta,
  normalizeSchoolCodeText,
  parseYearText,
} from "@/lib/analysis/univ-alimi-raw/row-utils";
import type {
  UnivAlimiColMap,
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
  UnivAlimiRawDashboardData,
  UnivAlimiRawQuery,
  UnivAlimiRawRow,
  UnivAlimiRawSheet,
} from "@/lib/analysis/univ-alimi-raw/types";
import { loadCsvYearMapped } from "@/lib/csv/csv-year-load";
import type { CsvFileKey } from "@/lib/csv/paths";
import { UNIV_ALIMI_CSV_KEY } from "@/lib/ingest/univ-alimi-raw-config";
import { readUnivAlimiRawMeta } from "@/lib/ingest/univ-alimi-raw-meta";
import { loadSchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";
import type { SchoolDivisionLookup } from "@/lib/ingest/school-code-lookup";

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function emptySheet(kind: UnivAlimiDatasetKind): UnivAlimiRawSheet {
  return {
    kind,
    label: UNIV_ALIMI_DATASET_LABEL[kind],
    fileName: `${UNIV_ALIMI_DATASET_LABEL[kind]}.xlsx`,
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
  cols: UnivAlimiColMap,
  lookup: SchoolDivisionLookup | null,
): UnivAlimiRawRow | null {
  let cells: string[] = [];
  try {
    cells = JSON.parse(r.cells_json ?? "[]") as string[];
  } catch {
    return null;
  }
  const parsed = buildRowMeta(cells, cols, lookup);
  parsed.yearText = r.year_text ?? parsed.yearText;
  parsed.schoolCodeStd = normalizeSchoolCodeText(
    r.school_code_std ?? parsed.schoolCodeStd,
  );
  if (parsed.cells[cols.schoolCode] !== parsed.schoolCodeStd) {
    parsed.cells[cols.schoolCode] = parsed.schoolCodeStd;
  }
  parsed.schoolKind = r.school_kind ?? parsed.schoolKind;
  parsed.estb = r.estb ?? parsed.estb;
  parsed.region = r.region ?? parsed.region;
  parsed.schoolName = r.school_name ?? parsed.schoolName;
  return parsed;
}

async function loadSheet(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
  lookup: SchoolDivisionLookup | null,
  year: number | "latest" | null,
): Promise<{
  sheet: UnivAlimiRawSheet;
  csvKey: CsvFileKey | null;
  yearRows: UnivAlimiRawRow[];
  displayYear: number | null;
}> {
  const csvKey = UNIV_ALIMI_CSV_KEY[indicator][kind];
  const cols = UNIV_ALIMI_COL[indicator][kind];
  if (!csvKey || !cols) {
    return { sheet: emptySheet(kind), csvKey: null, yearRows: [], displayYear: null };
  }

  const [mapped, meta] = await Promise.all([
    loadCsvYearMapped<UnivAlimiRawRow>({
      csvKey,
      cacheKey: `${csvKey}:${kind}`,
      yearOf,
      mapRow: (row) => parseCsvRecord(row, cols, lookup),
      year,
    }),
    readUnivAlimiRawMeta(indicator, kind),
  ]);

  return {
    csvKey,
    yearRows: mapped.rows,
    displayYear: mapped.displayYear,
    sheet: {
      kind,
      label: UNIV_ALIMI_DATASET_LABEL[kind],
      fileName: meta?.fileName ?? `${UNIV_ALIMI_DATASET_LABEL[kind]}.xlsx`,
      headerRows: meta?.headerRows ?? [],
      headerMerges: meta?.headerMerges,
      rows: [],
      columnCount: meta?.columnCount ?? 0,
      years: mapped.years,
      uploadedAt: mapped.uploadedAt ?? meta?.uploadedAt ?? null,
      rowCount: mapped.rowCount,
    },
  };
}

export async function loadUnivAlimiRawDashboard(
  indicator: UnivAlimiIndicatorId,
  query: UnivAlimiRawQuery,
): Promise<UnivAlimiRawDashboardData> {
  const lookup = await loadSchoolDivisionLookup();
  const datasets = getUnivAlimiDatasets(indicator);
  const dataset =
    query.dataset && datasets.includes(query.dataset)
      ? query.dataset
      : (datasets[0] ?? "undergrad");
  const yearArg = query.year ?? "latest";

  const [undergradLoaded, gradLoaded] = await Promise.all([
    loadSheet(
      indicator,
      "undergrad",
      lookup,
      dataset === "undergrad" ? yearArg : null,
    ),
    datasets.includes("grad")
      ? loadSheet(indicator, "grad", lookup, dataset === "grad" ? yearArg : null)
      : Promise.resolve({
          sheet: emptySheet("grad"),
          csvKey: null,
          yearRows: [] as UnivAlimiRawRow[],
          displayYear: null,
        }),
  ]);

  const activeLoaded =
    dataset === "undergrad" ? undergradLoaded : gradLoaded;
  const activeSheet = activeLoaded.sheet;

  let displayYear =
    query.year != null && activeSheet.years.includes(query.year)
      ? query.year
      : (activeLoaded.displayYear ?? activeSheet.years[0] ?? null);
  let yearRows = activeLoaded.yearRows;
  if (
    displayYear != null &&
    activeLoaded.displayYear !== displayYear &&
    activeLoaded.csvKey &&
    UNIV_ALIMI_COL[indicator][dataset]
  ) {
    const retry = await loadSheet(indicator, dataset, lookup, displayYear);
    yearRows = retry.yearRows;
    displayYear = retry.displayYear ?? displayYear;
  }

  const estbFilter = query.estb?.trim() ?? "";
  const schoolDivisionFilter = query.schoolDivision?.trim() ?? "";
  const schoolKindsFilter = parseMultiFilterParam(query.schoolKind);
  const regionsFilter = parseMultiFilterParam(query.region);
  const searchFilter = query.search?.trim() ?? "";

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
    indicator,
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

export function parseUnivAlimiRawQuery(
  searchParams: Record<string, string | undefined>,
): UnivAlimiRawQuery {
  const year = Number(searchParams.year);
  const datasetRaw = searchParams.dataset;
  const dataset =
    datasetRaw === "grad" || datasetRaw === "undergrad"
      ? datasetRaw
      : undefined;

  return {
    dataset,
    year: Number.isFinite(year) ? year : undefined,
    estb: searchParams.estb,
    schoolDivision: searchParams.schoolDivision,
    schoolKind: searchParams.schoolKind,
    region: searchParams.region,
    search: searchParams.search,
  };
}
