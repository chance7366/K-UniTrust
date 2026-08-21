import { readFile, stat } from "fs/promises";
import { parse } from "csv-parse/sync";
import { csvPath, type CsvFileKey } from "@/lib/csv/paths";

type CsvCacheEntry = {
  mtimeMs: number;
  rows: Record<string, string>[];
};

const csvMemoryCache = new Map<CsvFileKey, CsvCacheEntry>();

export function invalidateCsvCache(key?: CsvFileKey) {
  if (key) {
    csvMemoryCache.delete(key);
    return;
  }
  csvMemoryCache.clear();
}

export function getCachedCsvMtime(key: CsvFileKey): number | null {
  return csvMemoryCache.get(key)?.mtimeMs ?? null;
}

export async function readCsvFile(
  key: CsvFileKey,
): Promise<Record<string, string>[]> {
  const filePath = csvPath(key);
  const fileStat = await stat(filePath);
  const cached = csvMemoryCache.get(key);

  if (cached && cached.mtimeMs === fileStat.mtimeMs) {
    return cached.rows;
  }

  const raw = await readFile(filePath, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  csvMemoryCache.set(key, { mtimeMs: fileStat.mtimeMs, rows: records });
  return records;
}
