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

/** Stat/revision only — does not parse or retain rows. */
export async function peekCsvFileVersion(key: CsvFileKey): Promise<number> {
  if (shouldReadRemoteCsvStore()) {
    const revision = await getCsvStoreRevision();
    const version = revision > 0 ? revision : blobEpoch;
    noteCsvVersion(key, version);
    return version;
  }
  try {
    const fileStat = await stat(csvPath(key));
    noteCsvVersion(key, fileStat.mtimeMs);
    return fileStat.mtimeMs;
  } catch {
    return csvVersions.get(key) ?? 0;
  }
}

export async function peekLocalCsvVersion(key: CsvFileKey): Promise<number> {
  return peekCsvFileVersion(key);
}

export async function readCsvFileFromDisk(
  key: CsvFileKey,
): Promise<Record<string, string>[]> {
  try {
    const filePath = csvPath(key);
    const fileStat = await stat(filePath);
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return [];
    const records = parseCsvText(raw);
    noteCsvVersion(key, fileStat.mtimeMs);
    return records;
  } catch {
    return [];
  }
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

  try {
    const filePath = csvPath(key);
    const fileStat = await stat(filePath);
    const raw = await readFile(filePath, "utf8");
    const records = raw.trim() ? parseCsvText(raw) : [];
    noteCsvVersion(key, fileStat.mtimeMs);
    return records;
  } catch {
    return [];
  }
}
