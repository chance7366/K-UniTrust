import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { gunzipSync, gzipSync } from "zlib";

import { ACCESS_COOKIE } from "@/lib/auth/access";
import { CSV_DIR } from "@/lib/csv/paths";

export const PROD_SYNC_HEADER = "x-kunitrust-store-sync";
export const PROD_SYNC_GZIP_HEADER = "x-kunitrust-content-encoding";
/** Vercel 서버리스 요청/응답 한도(~4.5MB)보다 작은 본문은 gzip 없이 보낸다. */
const GZIP_MIN_BYTES = 3 * 1024 * 1024;

export function encodeStoreBody(
  text: string,
  contentType: string,
): { body: string | Uint8Array; headers: Record<string, string> } {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes < GZIP_MIN_BYTES) {
    return { body: text, headers: { "content-type": contentType } };
  }
  return {
    body: new Uint8Array(gzipSync(Buffer.from(text, "utf8"))),
    headers: {
      "content-type": contentType,
      [PROD_SYNC_GZIP_HEADER]: "gzip",
    },
  };
}

export async function decodeStoreBody(res: Response): Promise<string> {
  const buf = Buffer.from(await res.arrayBuffer());
  if (res.headers.get(PROD_SYNC_GZIP_HEADER) === "gzip") {
    return gunzipSync(buf).toString("utf8");
  }
  return buf.toString("utf8");
}

export async function readEncodedStoreRequest(request: Request): Promise<string> {
  const buf = Buffer.from(await request.arrayBuffer());
  if (request.headers.get(PROD_SYNC_GZIP_HEADER) === "gzip") {
    return gunzipSync(buf).toString("utf8");
  }
  return buf.toString("utf8");
}


const DEFAULT_PROD_URL = "https://k-uni-trust-six.vercel.app";
const REVISION_TTL_MS = 30_000;

let loggedSync = false;
let cachedCookie: { value: string; expMs: number } | null = null;
let revisionCache: { value: number; expMs: number } | null = null;
const inflight = new Map<string, Promise<string | null>>();

export function productionAppUrl(): string {
  return (process.env.KUNITRUST_PROD_URL ?? DEFAULT_PROD_URL).replace(
    /\/$/,
    "",
  );
}

/** Local `next dev` may still *write* uploads to production. Reads use disk. */
export function shouldSyncProdDataStore(): boolean {
  if (process.env.KUNITRUST_DISABLE_PROD_STORE_SYNC === "1") return false;
  if (process.env.VERCEL) return false;
  return process.env.NODE_ENV === "development";
}

function csvNameOk(name: string): boolean {
  return /^[A-Za-z0-9._-]+\.(csv|json|txt)$/.test(name);
}

function dataPathOk(name: string): boolean {
  return /^json\/[A-Za-z0-9._/-]+\.json$/.test(name) && !name.includes("..");
}

export function assertStoreObjectName(
  bucket: "csv" | "data",
  name: string,
): void {
  if (bucket === "csv" && !csvNameOk(name)) {
    throw new Error("허용되지 않은 CSV 저장소 파일입니다.");
  }
  if (bucket === "data" && !dataPathOk(name)) {
    throw new Error("허용되지 않은 데이터 경로입니다.");
  }
}

function stampPath(fileName: string): string {
  return path.join(CSV_DIR, ".prod-sync", `${fileName}.rev`);
}

function csvDiskPath(fileName: string): string {
  return path.join(CSV_DIR, fileName);
}

async function readStamp(fileName: string): Promise<number> {
  try {
    const n = Number((await readFile(stampPath(fileName), "utf8")).trim());
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function writeStamp(fileName: string, revision: number): Promise<void> {
  if (revision <= 0) return;
  try {
    await mkdir(path.dirname(stampPath(fileName)), { recursive: true });
    await writeFile(stampPath(fileName), String(revision), "utf8");
  } catch {
    /* ignore */
  }
}

async function readCsvDisk(fileName: string): Promise<string | null> {
  try {
    return await readFile(csvDiskPath(fileName), "utf8");
  } catch {
    return null;
  }
}

async function persistCsvDisk(fileName: string, body: string): Promise<void> {
  try {
    await mkdir(CSV_DIR, { recursive: true });
    await writeFile(csvDiskPath(fileName), body, "utf8");
  } catch {
    /* ignore */
  }
}

function cookieHeaderFromSetCookie(res: Response): string {
  const cookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""];
  return cookies
    .map((c) => c.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
}

async function loginCookie(): Promise<string> {
  const password = process.env.KUNITRUST_ADMIN_PASSWORD ?? "";
  if (!password) {
    throw new Error("운영 동기화에 KUNITRUST_ADMIN_PASSWORD 가 필요합니다.");
  }
  const res = await fetch(`${productionAppUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new Error(`운영 로그인 실패 (${res.status})`);
  }
  const cookie = cookieHeaderFromSetCookie(res);
  if (!cookie.includes(`${ACCESS_COOKIE}=`)) {
    throw new Error("운영 로그인 쿠키를 받지 못했습니다.");
  }
  return cookie;
}

async function authCookie(): Promise<string> {
  const now = Date.now();
  if (cachedCookie && cachedCookie.expMs > now + 60_000) {
    return cachedCookie.value;
  }
  const cookie = await loginCookie();
  cachedCookie = { value: cookie, expMs: now + 6 * 60 * 60 * 1000 };
  return cookie;
}

async function prodFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const cookie = await authCookie();
  let res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      cookie,
      [PROD_SYNC_HEADER]: "1",
    },
  });
  if (res.status === 401) {
    cachedCookie = null;
    const retryCookie = await loginCookie();
    cachedCookie = { value: retryCookie, expMs: Date.now() + 6 * 60 * 60 * 1000 };
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        cookie: retryCookie,
        [PROD_SYNC_HEADER]: "1",
      },
    });
  }
  return res;
}

function storeUrl(bucket: "csv" | "data", name: string): string {
  const params = new URLSearchParams({ bucket, name });
  return `${productionAppUrl()}/api/admin/data-store?${params.toString()}`;
}

function noteSyncOnce() {
  if (loggedSync) return;
  loggedSync = true;
  console.info(
    `[data-store] 로컬 개발 서버가 운영(${productionAppUrl()}) 저장소와 동기화합니다.`,
  );
}

async function fetchProdStoreText(
  bucket: "csv" | "data",
  name: string,
): Promise<string | null> {
  noteSyncOnce();
  try {
    const res = await prodFetch(storeUrl(bucket, name), { method: "GET" });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn("[data-store] read failed", bucket, name, res.status);
      return null;
    }
    const text = await decodeStoreBody(res);
    return text || null;
  } catch (err) {
    console.warn("[data-store] read error", bucket, name, err);
    return null;
  }
}

export async function getProdCsvRevision(): Promise<number> {
  if (!shouldSyncProdDataStore()) return 0;
  const now = Date.now();
  if (revisionCache && revisionCache.expMs > now) {
    return revisionCache.value;
  }
  const raw = await fetchProdStoreText("csv", "_revision.txt");
  const n = Number(raw?.trim());
  const value = Number.isFinite(n) && n > 0 ? n : 0;
  revisionCache = { value, expMs: now + REVISION_TTL_MS };
  return value;
}

async function getProdStoreTextUncached(
  bucket: "csv" | "data",
  name: string,
): Promise<string | null> {
  if (bucket === "csv" && name !== "_revision.txt") {
    const revision = await getProdCsvRevision();
    if (revision > 0 && (await readStamp(name)) === revision) {
      const disk = await readCsvDisk(name);
      if (disk != null) return disk;
    }
  }

  const remote = await fetchProdStoreText(bucket, name);
  if (remote != null && bucket === "csv" && name !== "_revision.txt") {
    await persistCsvDisk(name, remote);
    await writeStamp(name, await getProdCsvRevision());
  }
  if (remote != null) return remote;

  if (bucket === "csv") return readCsvDisk(name);
  return null;
}

/** Download a newer prod CSV in the background. Returns true if disk changed. */
export async function refreshProdCsvIfStale(fileName: string): Promise<boolean> {
  if (!shouldSyncProdDataStore()) return false;
  assertStoreObjectName("csv", fileName);
  const revision = await getProdCsvRevision();
  if (revision > 0 && (await readStamp(fileName)) === revision) {
    return false;
  }
  const remote = await fetchProdStoreText("csv", fileName);
  if (remote == null) return false;
  await persistCsvDisk(fileName, remote);
  await writeStamp(fileName, revision > 0 ? revision : await getProdCsvRevision());
  return true;
}

export async function getProdStoreText(
  bucket: "csv" | "data",
  name: string,
): Promise<string | null> {
  if (!shouldSyncProdDataStore()) return null;
  assertStoreObjectName(bucket, name);
  const key = `${bucket}:${name}`;
  const pending = inflight.get(key);
  if (pending) return pending;
  const next = getProdStoreTextUncached(bucket, name).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, next);
  return next;
}

export async function putProdStoreText(
  bucket: "csv" | "data",
  name: string,
  body: string,
  contentType: string,
): Promise<void> {
  if (!shouldSyncProdDataStore()) return;
  assertStoreObjectName(bucket, name);
  noteSyncOnce();
  const { body: payload, headers } = encodeStoreBody(body, contentType);
  const res = await prodFetch(storeUrl(bucket, name), {
    method: "PUT",
    headers,
    body: payload as unknown as BodyInit,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `운영 저장소에 쓰지 못했습니다 (${res.status}): ${detail.slice(0, 240)}`,
    );
  }
  invalidateProdCsvRevisionCache();
  if (bucket === "csv") {
    await persistCsvDisk(name, body);
    await writeStamp(name, await getProdCsvRevision());
  }
}

export function invalidateProdCsvRevisionCache() {
  revisionCache = null;
}
