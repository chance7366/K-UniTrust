import {
  blobAuthOptions,
  isVercelBlobEnabled,
} from "@/lib/vercel-blob-env";

const CSV_REVISION_FILE = "_revision.txt";
const LARGE_PUT_BYTES = 4 * 1024 * 1024;

function csvBlobPath(fileName: string): string {
  return `csv/${fileName}`;
}

export async function putStorePath(
  pathname: string,
  body: string | Buffer,
  contentType: string,
): Promise<void> {
  if (!isVercelBlobEnabled()) return;

  const { put } = await import("@vercel/blob");
  const bytes = Buffer.isBuffer(body)
    ? body.length
    : Buffer.byteLength(body, "utf8");
  await put(pathname, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType,
    multipart: bytes >= LARGE_PUT_BYTES,
    ...blobAuthOptions(),
  });
}

export async function getStorePathText(pathname: string): Promise<string | null> {
  if (!isVercelBlobEnabled()) return null;

  const { get } = await import("@vercel/blob");
  const delays = [0, 250, 800];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) {
      await new Promise((r) => setTimeout(r, delays[i]));
    }
    try {
      const result = await get(pathname, {
        access: "private",
        useCache: false,
        ...blobAuthOptions(),
      });
      if (!result?.stream) continue;
      const text = await new Response(result.stream).text();
      if (text) return text;
    } catch (err) {
      console.warn("[blob] read failed", pathname, err);
    }
  }
  return null;
}

export async function deleteStorePath(pathname: string): Promise<void> {
  if (!isVercelBlobEnabled()) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(pathname, blobAuthOptions());
  } catch (err) {
    console.warn("[blob] delete failed", pathname, err);
  }
}

export async function listStorePathnames(prefix: string): Promise<string[]> {
  if (!isVercelBlobEnabled()) return [];
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix, ...blobAuthOptions() });
    return blobs.map((b) => b.pathname);
  } catch (err) {
    console.warn("[blob] list failed", prefix, err);
    return [];
  }
}

export async function getCsvStoreRevision(): Promise<number> {
  const raw = await getCsvStoreFile(CSV_REVISION_FILE);
  const n = Number(raw?.trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function bumpCsvStoreRevision(): Promise<number> {
  if (!isVercelBlobEnabled()) return 0;
  const next = (await getCsvStoreRevision()) + 1;
  await putCsvStoreFile(
    CSV_REVISION_FILE,
    String(next),
    "text/plain; charset=utf-8",
  );
  return next;
}

export async function putCsvStoreFile(
  fileName: string,
  body: string,
  contentType: string,
): Promise<void> {
  await putStorePath(csvBlobPath(fileName), body, contentType);
}

export async function getCsvStoreFile(fileName: string): Promise<string | null> {
  return getStorePathText(csvBlobPath(fileName));
}
