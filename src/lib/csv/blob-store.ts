import {
  blobAuthOptions,
  isVercelBlobEnabled,
} from "@/lib/vercel-blob-env";

const CSV_REVISION_FILE = "_revision.txt";

function blobPath(fileName: string): string {
  return `csv/${fileName}`;
}

export async function getCsvStoreRevision(): Promise<number> {
  const raw = await getCsvStoreFile(CSV_REVISION_FILE);
  const n = Number(raw?.trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function bumpCsvStoreRevision(): Promise<number> {
  if (!isVercelBlobEnabled()) return 0;
  const next = (await getCsvStoreRevision()) + 1;
  await putCsvStoreFile(CSV_REVISION_FILE, String(next), "text/plain; charset=utf-8");
  return next;
}

export async function putCsvStoreFile(
  fileName: string,
  body: string,
  contentType: string,
): Promise<void> {
  if (!isVercelBlobEnabled()) return;

  const { put } = await import("@vercel/blob");
  await put(blobPath(fileName), body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType,
    ...blobAuthOptions(),
  });
}

export async function getCsvStoreFile(fileName: string): Promise<string | null> {
  if (!isVercelBlobEnabled()) return null;

  const { get } = await import("@vercel/blob");
  const delays = [0, 250, 800];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) {
      await new Promise((r) => setTimeout(r, delays[i]));
    }
    try {
      const result = await get(blobPath(fileName), {
        access: "private",
        useCache: false,
        ...blobAuthOptions(),
      });
      if (!result?.stream) continue;
      const text = await new Response(result.stream).text();
      if (text) return text;
    } catch (err) {
      console.warn("[csv-blob] read failed", fileName, err);
    }
  }
  return null;
}
