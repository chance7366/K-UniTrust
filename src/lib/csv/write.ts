import { mkdir, writeFile } from "fs/promises";
import { stringify } from "csv-stringify/sync";
import { CSV_DIR, csvPath, type CsvFileKey } from "@/lib/csv/paths";
import { invalidateCsvCache } from "@/lib/csv/read";

export async function writeCsvFile(
  key: CsvFileKey,
  rows: Record<string, unknown>[],
  columns: string[],
): Promise<string> {
  await mkdir(CSV_DIR, { recursive: true });
  const filePath = csvPath(key);
  const body = stringify(rows, {
    header: true,
    columns,
    bom: true,
  });
  await writeFile(filePath, body, "utf8");
  invalidateCsvCache(key);
  return filePath;
}