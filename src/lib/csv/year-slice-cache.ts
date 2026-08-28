import type { CsvFileKey } from "@/lib/csv/paths";
import { getCachedCsvMtime } from "@/lib/csv/read";

export type YearSliceCache<T> = {
  mtimeMs: number;
  years: number[];
  byYear: Map<number, T[]>;
};

const caches = new Map<string, YearSliceCache<unknown>>();

export function invalidateYearSliceCache() {
  caches.clear();
}

export function collectYearsFromRecords(
  csvRows: Record<string, string>[],
  yearOf: (row: Record<string, string>) => number | null,
  order: "desc" | "asc" = "desc",
): number[] {
  const yearSet = new Set<number>();
  for (const row of csvRows) {
    const year = yearOf(row);
    if (year) yearSet.add(year);
  }
  const years = [...yearSet];
  years.sort((a, b) => (order === "desc" ? b - a : a - b));
  return years;
}

export function getOrCreateYearSliceCache<T>(
  cacheKey: string,
  csvKey: CsvFileKey,
  csvRows: Record<string, string>[],
  yearOf: (row: Record<string, string>) => number | null,
  order: "desc" | "asc" = "desc",
): YearSliceCache<T> {
  const mtimeMs = getCachedCsvMtime(csvKey) ?? 0;
  const existing = caches.get(cacheKey) as YearSliceCache<T> | undefined;
  if (existing && existing.mtimeMs === mtimeMs) return existing;

  const next: YearSliceCache<T> = {
    mtimeMs,
    years: collectYearsFromRecords(csvRows, yearOf, order),
    byYear: new Map(),
  };
  caches.set(cacheKey, next);
  return next;
}

export function loadYearSlice<T>(
  cache: YearSliceCache<T>,
  year: number,
  build: () => T[],
): T[] {
  const hit = cache.byYear.get(year);
  if (hit) return hit;
  const rows = build();
  cache.byYear.set(year, rows);
  return rows;
}
