import type { CsvFileKey } from "@/lib/csv/paths";

export type YearSliceCache<T> = {
  mtimeMs: number;
  years: number[];
  rowCount: number;
  uploadedAt: string | null;
  byYear: Map<number, T[]>;
  yearOrder: number[];
  lastUsed: number;
};

const MAX_YEARS_PER_KEY = 16;
const MAX_SLICE_KEYS = 16;

const caches = new Map<string, YearSliceCache<unknown>>();

export function invalidateYearSliceCache() {
  caches.clear();
}

export function dropYearSliceCachesForCsv(csvKey: CsvFileKey) {
  for (const key of [...caches.keys()]) {
    if (key === csvKey || key.startsWith(`${csvKey}:`)) {
      caches.delete(key);
    }
  }
}

function evictSliceKeys(keepKey: string) {
  while (caches.size > MAX_SLICE_KEYS) {
    let victim: string | null = null;
    let oldest = Infinity;
    for (const [key, cache] of caches) {
      if (key === keepKey) continue;
      if (cache.lastUsed < oldest) {
        oldest = cache.lastUsed;
        victim = key;
      }
    }
    if (!victim) break;
    caches.delete(victim);
  }
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

export function latestUploadedAt(csvRows: Record<string, string>[]): string | null {
  let latest: string | null = null;
  for (const row of csvRows) {
    const at = row.uploaded_at?.trim();
    if (at && (!latest || at > latest)) latest = at;
  }
  return latest;
}

export function peekYearSliceCache<T>(
  cacheKey: string,
  version: number,
): YearSliceCache<T> | null {
  const existing = caches.get(cacheKey) as YearSliceCache<T> | undefined;
  if (!existing || existing.mtimeMs !== version) return null;
  existing.lastUsed = Date.now();
  evictSliceKeys(cacheKey);
  return existing;
}

export function createYearSliceCache<T>(
  cacheKey: string,
  version: number,
  years: number[],
  rowCount: number,
  uploadedAt: string | null,
): YearSliceCache<T> {
  const next: YearSliceCache<T> = {
    mtimeMs: version,
    years,
    rowCount,
    uploadedAt,
    byYear: new Map(),
    yearOrder: [],
    lastUsed: Date.now(),
  };
  caches.set(cacheKey, next);
  evictSliceKeys(cacheKey);
  return next;
}

export function getOrCreateYearSliceCache<T>(
  cacheKey: string,
  _csvKey: CsvFileKey,
  csvRows: Record<string, string>[],
  yearOf: (row: Record<string, string>) => number | null,
  order: "desc" | "asc" = "desc",
  version = 0,
): YearSliceCache<T> {
  const existing = peekYearSliceCache<T>(cacheKey, version);
  if (existing) return existing;
  return createYearSliceCache<T>(
    cacheKey,
    version,
    collectYearsFromRecords(csvRows, yearOf, order),
    csvRows.length,
    latestUploadedAt(csvRows),
  );
}

export function loadYearSlice<T>(
  cache: YearSliceCache<T>,
  year: number,
  build: () => T[],
): T[] {
  const hit = cache.byYear.get(year);
  if (hit) {
    const idx = cache.yearOrder.indexOf(year);
    if (idx >= 0) cache.yearOrder.splice(idx, 1);
    cache.yearOrder.push(year);
    cache.lastUsed = Date.now();
    return hit;
  }
  const rows = build();
  cache.byYear.set(year, rows);
  cache.yearOrder.push(year);
  cache.lastUsed = Date.now();
  while (cache.byYear.size > MAX_YEARS_PER_KEY) {
    const evictYear = cache.yearOrder.shift();
    if (evictYear == null || evictYear === year) continue;
    cache.byYear.delete(evictYear);
  }
  return rows;
}
