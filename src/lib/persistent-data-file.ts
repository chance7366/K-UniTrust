import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

import {
  deleteStorePath,
  getStorePathText,
  listStorePathnames,
  putStorePath,
} from "@/lib/csv/blob-store";
import {
  isVercelBlobEnabled,
  shouldReadRemoteCsvStore,
} from "@/lib/vercel-blob-env";

const DATA_ROOT = path.join(process.cwd(), "data");

function diskPath(relUnderData: string): string {
  return path.join(DATA_ROOT, ...relUnderData.split("/"));
}

function blobPath(relUnderData: string): string {
  return `data/${relUnderData.replace(/\\/g, "/")}`;
}

async function persistOverlayToDisk(relUnderData: string, body: string) {
  try {
    const filePath = diskPath(relUnderData);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, "utf8");
  } catch {
    /* Vercel disk is read-only */
  }
}

export async function readPersistentTextFile(
  relUnderData: string,
): Promise<string | null> {
  if (shouldReadRemoteCsvStore()) {
    const remote = await getStorePathText(blobPath(relUnderData));
    if (remote) {
      await persistOverlayToDisk(relUnderData, remote);
      return remote;
    }
  }
  try {
    return await readFile(diskPath(relUnderData), "utf8");
  } catch {
    if (shouldReadRemoteCsvStore()) {
      const retry = await getStorePathText(blobPath(relUnderData));
      if (retry) {
        await persistOverlayToDisk(relUnderData, retry);
        return retry;
      }
    }
    return null;
  }
}

export async function writePersistentTextFile(
  relUnderData: string,
  body: string,
  contentType = "application/json; charset=utf-8",
): Promise<void> {
  const filePath = diskPath(relUnderData);
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, "utf8");
  } catch (err) {
    if (!isVercelBlobEnabled()) {
      if (process.env.VERCEL) {
        throw new Error(
          "Vercel에서는 분석 결과를 Blob에 저장해야 합니다. BLOB_READ_WRITE_TOKEN 또는 BLOB_STORE_ID를 설정하세요.",
        );
      }
      throw err;
    }
  }
  await putStorePath(blobPath(relUnderData), body, contentType);
}

export async function deletePersistentTextFile(
  relUnderData: string,
): Promise<void> {
  try {
    await rm(diskPath(relUnderData), { force: true });
  } catch {
    /* read-only FS */
  }
  await deleteStorePath(blobPath(relUnderData));
}

export async function listPersistentPathnames(
  relPrefixUnderData: string,
): Promise<string[]> {
  return listStorePathnames(`data/${relPrefixUnderData.replace(/\\/g, "/")}`);
}
