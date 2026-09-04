import { mkdir, writeFile } from "fs/promises";
import { stringify } from "csv-stringify/sync";

import { bumpCsvStoreRevision, putCsvStoreFile } from "@/lib/csv/blob-store";
import { CSV_DIR, CSV_FILES, csvPath, type CsvFileKey } from "@/lib/csv/paths";
import { invalidateCsvCache } from "@/lib/csv/read";
import { invalidateYearSliceCache } from "@/lib/csv/year-slice-cache";
import { invalidateSchoolCampusIndexCache } from "@/lib/ingest/school-code-campus-index";
import { invalidateSchoolLookupCaches } from "@/lib/ingest/school-code-lookup";
import {
  invalidateProdCsvRevisionCache,
  putProdStoreText,
  shouldSyncProdDataStore,
} from "@/lib/prod-store-sync";
import { isVercelBlobEnabled, shouldReadRemoteCsvStore } from "@/lib/vercel-blob-env";

export async function writeCsvFile(
  key: CsvFileKey,
  rows: Record<string, unknown>[],
  columns: string[],
): Promise<string> {
  const body = stringify(rows, {
    header: true,
    columns,
    bom: true,
  });
  const filePath = csvPath(key);

  try {
    await mkdir(CSV_DIR, { recursive: true });
    await writeFile(filePath, body, "utf8");
  } catch (err) {
    if (!isVercelBlobEnabled()) {
      if (process.env.VERCEL) {
        throw new Error(
          "Vercel에서는 업로드 파일을 Blob에 저장해야 합니다. BLOB_READ_WRITE_TOKEN 또는 BLOB_STORE_ID를 설정하세요.",
        );
      }
      throw err;
    }
  }

  await putCsvStoreFile(CSV_FILES[key], body, "text/csv; charset=utf-8");
  // revision은 Blob CSV 읽기 폴백(BLOB_CSV_READ_FALLBACK)용. 기본 배포분 우선 모드에서는 생략해 Simple/Advanced Ops를 줄인다.
  if (isVercelBlobEnabled() && shouldReadRemoteCsvStore()) {
    await bumpCsvStoreRevision();
  } else if (shouldSyncProdDataStore()) {
    await putProdStoreText(
      "csv",
      CSV_FILES[key],
      body,
      "text/csv; charset=utf-8",
    );
    invalidateProdCsvRevisionCache();
  }
  invalidateCsvCache(key);
  invalidateYearSliceCache();
  if (key === "financeAnalysisSchoolCode") {
    invalidateSchoolCampusIndexCache();
    invalidateSchoolLookupCaches();
  }
  return filePath;
}
