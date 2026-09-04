import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { getCsvStoreFile, putCsvStoreFile } from "@/lib/csv/blob-store";
import { CSV_DIR } from "@/lib/csv/paths";
import {
  putProdStoreText,
  shouldSyncProdDataStore,
} from "@/lib/prod-store-sync";
import {
  isVercelBlobEnabled,
  shouldReadRemoteCsvStore,
} from "@/lib/vercel-blob-env";

function diskPath(fileName: string): string {
  return path.join(CSV_DIR, fileName);
}

export async function readTextOverlayFile(
  fileName: string,
): Promise<string | null> {
  try {
    const raw = await readFile(diskPath(fileName), "utf8");
    if (raw.trim()) return raw;
  } catch {
    /* fall through */
  }

  // Prefer Git-deployed meta; Blob only when explicitly enabled.
  if (!shouldReadRemoteCsvStore()) return null;

  const remote = await getCsvStoreFile(fileName);
  if (!remote) return null;
  try {
    await mkdir(CSV_DIR, { recursive: true });
    await writeFile(diskPath(fileName), remote, "utf8");
  } catch {
    // Vercel disk is read-only
  }
  return remote;
}

export async function writeTextOverlayFile(
  fileName: string,
  body: string,
  contentType: string,
): Promise<void> {
  try {
    await mkdir(CSV_DIR, { recursive: true });
    await writeFile(diskPath(fileName), body, "utf8");
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
  await putCsvStoreFile(fileName, body, contentType);
  if (!isVercelBlobEnabled() && shouldSyncProdDataStore()) {
    await putProdStoreText("csv", fileName, body, contentType);
  }
}
