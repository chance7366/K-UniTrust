import { stat } from "fs/promises";

import { csvPath, type CsvFileKey } from "@/lib/csv/paths";

async function csvMtime(key: CsvFileKey): Promise<number> {
  try {
    return (await stat(csvPath(key))).mtimeMs;
  } catch {
    return 0;
  }
}

export async function isRepDbStale(
  dest: CsvFileKey,
  sources: CsvFileKey[],
): Promise<boolean> {
  const destM = await csvMtime(dest);
  if (!destM) return true;
  const sourceMs = await Promise.all(sources.map(csvMtime));
  return sourceMs.some((mtime) => mtime > destM);
}
