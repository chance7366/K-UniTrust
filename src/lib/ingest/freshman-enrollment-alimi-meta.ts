import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { getCsvStoreFile, putCsvStoreFile } from "@/lib/csv/blob-store";
import { CSV_DIR } from "@/lib/csv/paths";
import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";
import { FRESHMAN_ENROLLMENT_ALIMI_META_FILE } from "@/lib/ingest/freshman-enrollment-alimi-config";
import { isVercelBlobEnabled } from "@/lib/vercel-blob-env";

export type FreshmanEnrollmentAlimiMeta = {
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  columnCount: number;
  uploadedAt: string | null;
  fileName: string | null;
};

function metaFileName(kind: FreshmanEnrollmentDatasetKind): string {
  return FRESHMAN_ENROLLMENT_ALIMI_META_FILE[kind];
}

function metaPath(kind: FreshmanEnrollmentDatasetKind): string {
  return path.join(CSV_DIR, metaFileName(kind));
}

export async function readFreshmanEnrollmentAlimiMeta(
  kind: FreshmanEnrollmentDatasetKind,
): Promise<FreshmanEnrollmentAlimiMeta | null> {
  if (isVercelBlobEnabled() && process.env.VERCEL) {
    const remote = await getCsvStoreFile(metaFileName(kind));
    if (remote) {
      try {
        return JSON.parse(remote) as FreshmanEnrollmentAlimiMeta;
      } catch {
        return null;
      }
    }
  }
  try {
    const raw = await readFile(metaPath(kind), "utf8");
    return JSON.parse(raw) as FreshmanEnrollmentAlimiMeta;
  } catch {
    return null;
  }
}

export async function writeFreshmanEnrollmentAlimiMeta(
  kind: FreshmanEnrollmentDatasetKind,
  meta: FreshmanEnrollmentAlimiMeta,
): Promise<void> {
  const body = JSON.stringify(meta, null, 2);
  try {
    await mkdir(CSV_DIR, { recursive: true });
    await writeFile(metaPath(kind), body, "utf8");
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
  await putCsvStoreFile(
    metaFileName(kind),
    body,
    "application/json; charset=utf-8",
  );
}
