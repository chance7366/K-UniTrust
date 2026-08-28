import {
  ACCESS_COOKIE,
  canUploadExcel,
  createAccessToken,
} from "@/lib/auth/access";

export const PROD_SYNC_HEADER = "x-kunitrust-store-sync";

const DEFAULT_PROD_URL = "https://k-uni-trust-six.vercel.app";
const REVISION_TTL_MS = 2000;

let loggedSync = false;
let cachedCookie: { value: string; expMs: number } | null = null;
let revisionCache: { value: number; expMs: number } | null = null;

export function productionAppUrl(): string {
  return (process.env.KUNITRUST_PROD_URL ?? DEFAULT_PROD_URL).replace(
    /\/$/,
    "",
  );
}

/** Local `next dev` follows the production Blob store over HTTPS. */
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

  try {
    const token = await createAccessToken("admin");
    const cookie = `${ACCESS_COOKIE}=${token}`;
    cachedCookie = { value: cookie, expMs: now + 6 * 60 * 60 * 1000 };
    return cookie;
  } catch {
    /* fall through to password login */
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

export async function getProdStoreText(
  bucket: "csv" | "data",
  name: string,
): Promise<string | null> {
  if (!shouldSyncProdDataStore()) return null;
  assertStoreObjectName(bucket, name);
  noteSyncOnce();
  try {
    const res = await prodFetch(storeUrl(bucket, name), { method: "GET" });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn("[data-store] read failed", bucket, name, res.status);
      return null;
    }
    const text = await res.text();
    return text || null;
  } catch (err) {
    console.warn("[data-store] read error", bucket, name, err);
    return null;
  }
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
  const res = await prodFetch(storeUrl(bucket, name), {
    method: "PUT",
    headers: { "content-type": contentType },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `운영 저장소에 쓰지 못했습니다 (${res.status}): ${detail.slice(0, 240)}`,
    );
  }
}

export async function getProdCsvRevision(): Promise<number> {
  if (!shouldSyncProdDataStore()) return 0;
  const now = Date.now();
  if (revisionCache && revisionCache.expMs > now) {
    return revisionCache.value;
  }
  const raw = await getProdStoreText("csv", "_revision.txt");
  const n = Number(raw?.trim());
  const value = Number.isFinite(n) && n > 0 ? n : 0;
  revisionCache = { value, expMs: now + REVISION_TTL_MS };
  return value;
}

export function invalidateProdCsvRevisionCache() {
  revisionCache = null;
}
