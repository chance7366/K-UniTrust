import { mkdir, readFile, stat, writeFile } from "fs/promises";
import { parse } from "csv-parse/sync";

import { getCsvStoreFile, getCsvStoreRevision } from "@/lib/csv/blob-store";
import { CSV_DIR, CSV_FILES, csvPath, type CsvFileKey } from "@/lib/csv/paths";
import {
  dropYearSliceCachesForCsv,
  invalidateYearSliceCache,
} from "@/lib/csv/year-slice-cache";
import { shouldReadRemoteCsvStore } from "@/lib/vercel-blob-env";

/** File version only — parsed row arrays are not kept in memory. */
const csvVersions = new Map<CsvFileKey, number>();
let blobEpoch = 1;

export function invalidateCsvCache(key?: CsvFileKey) {
  blobEpoch += 1;
  if (key) {
    csvVersions.delete(key);
    dropYearSliceCachesForCsv(key);
    return;
  }
  csvVersions.clear();
  invalidateYearSliceCache();
}

export function getCachedCsvMtime(key: CsvFileKey): number | null {
  return csvVersions.get(key) ?? null;
}

export function getCsvDataVersion(key: CsvFileKey): number | null {
  return csvVersions.get(key) ?? null;
}

function noteCsvVersion(key: CsvFileKey, version: number) {
  csvVersions.set(key, version);
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

async function persistOverlayToDisk(filePath: string, body: string) {
  try {
    await mkdir(CSV_DIR, { recursive: true });
    await writeFile(filePath, body, "utf8");
  } catch {
    // local disk copy is best-effort
  }
}

async function readDiskCsv(
  key: CsvFileKey,
): Promise<{ records: Record<string, string>[]; version: number } | null> {
  try {
    const filePath = csvPath(key);
    const fileStat = await stat(filePath);
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) {
      return { records: [], version: fileStat.mtimeMs };
    }
    return {
      records: parseCsvText(raw),
      version: fileStat.mtimeMs,
    };
  } catch {
    return null;
  }
}

/**
 * Stat only — does not hit Blob unless BLOB_CSV_READ_FALLBACK=1 and disk is missing.
 * Prefer Git-deployed data/csv mtime so Hobby Simple Ops stay near zero on page loads.
 */
export async function peekCsvFileVersion(key: CsvFileKey): Promise<number> {
  try {
    const fileStat = await stat(csvPath(key));
    noteCsvVersion(key, fileStat.mtimeMs);
    return fileStat.mtimeMs;
  } catch {
    if (shouldReadRemoteCsvStore()) {
      const revision = await getCsvStoreRevision();
      const version = revision > 0 ? revision : blobEpoch;
      noteCsvVersion(key, version);
      return version;
    }
    return csvVersions.get(key) ?? 0;
  }
}

export async function peekLocalCsvVersion(key: CsvFileKey): Promise<number> {
  return peekCsvFileVersion(key);
}

export async function readCsvFileFromDisk(
  key: CsvFileKey,
): Promise<Record<string, string>[]> {
  const disk = await readDiskCsv(key);
  if (!disk) return [];
  noteCsvVersion(key, disk.version);
  return disk.records;
}

const readInflight = new Map<CsvFileKey, Promise<Record<string, string>[]>>();

export async function readCsvFile(
  key: CsvFileKey,
): Promise<Record<string, string>[]> {
  const pending = readInflight.get(key);
  if (pending) return pending;
  const next = readCsvFileUncached(key).finally(() => {
    readInflight.delete(key);
  });
  readInflight.set(key, next);
  return next;
}

async function readCsvFileUncached(
  key: CsvFileKey,
): Promise<Record<string, string>[]> {
  const disk = await readDiskCsv(key);
  if (disk && disk.records.length > 0) {
    noteCsvVersion(key, disk.version);
    return disk.records;
  }
  if (disk && disk.records.length === 0 && !shouldReadRemoteCsvStore()) {
    noteCsvVersion(key, disk.version);
    return [];
  }

  // Disk missing/empty: optional Blob fallback (BLOB_CSV_READ_FALLBACK=1).
  if (shouldReadRemoteCsvStore()) {
    const revision = await getCsvStoreRevision();
    const remote = await getCsvStoreFile(CSV_FILES[key]);
    if (remote != null) {
      const records = parseCsvText(remote);
      noteCsvVersion(key, revision > 0 ? revision : blobEpoch);
      await persistOverlayToDisk(csvPath(key), remote);
      return records;
    }
  }

  if (disk) {
    noteCsvVersion(key, disk.version);
    return disk.records;
  }
  return [];
}
