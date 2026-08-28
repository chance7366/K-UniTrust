import { parse } from "csv-parse/sync";
import { readFile, stat } from "fs/promises";

import { getCsvStoreFile, getCsvStoreRevision } from "@/lib/csv/blob-store";
import { CSV_FILES, csvPath, type CsvFileKey } from "@/lib/csv/paths";
import { isVercelBlobEnabled } from "@/lib/vercel-blob-env";

type CsvCacheEntry = {
  mtimeMs: number;
  rows: Record<string, string>[];
};

const csvMemoryCache = new Map<CsvFileKey, CsvCacheEntry>();
let blobEpoch = 1;

export function invalidateCsvCache(key?: CsvFileKey) {
  blobEpoch += 1;
  if (key) {
    csvMemoryCache.delete(key);
    return;
  }
  csvMemoryCache.clear();
}

export function getCachedCsvMtime(key: CsvFileKey): number | null {
  return csvMemoryCache.get(key)?.mtimeMs ?? null;
}

function parseCsvText(raw: string): Record<string, string>[] {
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}

export async function readCsvFile(
  key: CsvFileKey,
): Promise<Record<string, string>[]> {
  if (isVercelBlobEnabled() && process.env.VERCEL) {
    const revision = await getCsvStoreRevision();
    const cached = csvMemoryCache.get(key);
    if (cached && cached.mtimeMs === revision && revision > 0) {
      return cached.rows;
    }

    const remote = await getCsvStoreFile(CSV_FILES[key]);
    if (remote != null) {
      const records = parseCsvText(remote);
      csvMemoryCache.set(key, {
        mtimeMs: revision > 0 ? revision : blobEpoch,
        rows: records,
      });
      return records;
    }
  }

  const filePath = csvPath(key);
  try {
    const fileStat = await stat(filePath);
    const cached = csvMemoryCache.get(key);

    if (cached && cached.mtimeMs === fileStat.mtimeMs) {
      return cached.rows;
    }

    const raw = await readFile(filePath, "utf8");
    const records = parseCsvText(raw);
    csvMemoryCache.set(key, { mtimeMs: fileStat.mtimeMs, rows: records });
    return records;
  } catch (err) {
    if (isVercelBlobEnabled() && process.env.VERCEL) {
      const retry = await getCsvStoreFile(CSV_FILES[key]);
      if (retry != null) {
        const records = parseCsvText(retry);
        csvMemoryCache.set(key, {
          mtimeMs: Date.now(),
          rows: records,
        });
        return records;
      }
    }
    throw err;
  }
}
