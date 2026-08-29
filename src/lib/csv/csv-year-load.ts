import type { CsvFileKey } from "@/lib/csv/paths";
import {
  getCsvDataVersion,
  peekCsvFileVersion,
  peekLocalCsvVersion,
  readCsvFile,
  readCsvFileFromDisk,
} from "@/lib/csv/read";
import {
  collectYearsFromRecords,
  createYearSliceCache,
  latestUploadedAt,
  loadYearSlice,
  peekYearSliceCache,
} from "@/lib/csv/year-slice-cache";

export type CsvYearLoadResult<T> = {
  years: number[];
  rowCount: number;
  uploadedAt: string | null;
  displayYear: number | null;
  rows: T[];
};

function resolveDisplayYear(
  years: number[],
  year: number | "latest" | null | undefined,
  order: "desc" | "asc",
): number | null {
  if (year == null) return null;
  if (year === "latest") {
    return (order === "asc" ? years.at(-1) : years[0]) ?? null;
  }
  return years.includes(year) ? year : null;
}

/**
 * Load a slim mapped year from CSV. Raw parsed records are discarded after
 * the index (and at most one year slice) is built.
 */
export async function loadCsvYearMapped<T>(options: {
  csvKey: CsvFileKey;
  cacheKey: string;
  yearOf: (row: Record<string, string>) => number | null;
  mapRow: (row: Record<string, string>) => T | null;
  year?: number | "latest" | null;
  order?: "desc" | "asc";
  mapAllYears?: boolean;
  localOnly?: boolean;
}): Promise<CsvYearLoadResult<T>> {
  const {
    csvKey,
    cacheKey,
    yearOf,
    mapRow,
    year,
    order = "desc",
    mapAllYears = false,
    localOnly = false,
  } = options;
  const version = localOnly
    ? await peekLocalCsvVersion(csvKey)
    : await peekCsvFileVersion(csvKey);
  const existing = peekYearSliceCache<T>(cacheKey, version);

  if (existing) {
    const displayYear = resolveDisplayYear(existing.years, year, order);
    if (displayYear == null || existing.byYear.has(displayYear)) {
      return {
        years: existing.years,
        rowCount: existing.rowCount,
        uploadedAt: existing.uploadedAt,
        displayYear,
        rows:
          displayYear == null
            ? []
            : loadYearSlice(existing, displayYear, () => []),
      };
    }
  }

  const csvRows = localOnly
    ? await readCsvFileFromDisk(csvKey)
    : await readCsvFile(csvKey).catch(() => []);
  const versionAfter = getCsvDataVersion(csvKey) ?? version;
  const years = collectYearsFromRecords(csvRows, yearOf, order);
  const rowCount = csvRows.length;
  const uploadedAt = latestUploadedAt(csvRows);
  const cache =
    peekYearSliceCache<T>(cacheKey, versionAfter) ??
    createYearSliceCache<T>(cacheKey, versionAfter, years, rowCount, uploadedAt);

  if (mapAllYears) {
    const buckets = new Map<number, T[]>();
    for (const raw of csvRows) {
      const rowYear = yearOf(raw);
      if (rowYear == null) continue;
      const row = mapRow(raw);
      if (!row) continue;
      const list = buckets.get(rowYear) ?? [];
      list.push(row);
      buckets.set(rowYear, list);
    }
    for (const rowYear of years) {
      loadYearSlice(cache, rowYear, () => buckets.get(rowYear) ?? []);
    }
  }

  const displayYear = resolveDisplayYear(years, year, order);
  const rows =
    displayYear == null
      ? []
      : loadYearSlice(cache, displayYear, () => {
          const mapped: T[] = [];
          for (const raw of csvRows) {
            if (yearOf(raw) !== displayYear) continue;
            const row = mapRow(raw);
            if (row) mapped.push(row);
          }
          return mapped;
        });

  return { years, rowCount, uploadedAt, displayYear, rows };
}
