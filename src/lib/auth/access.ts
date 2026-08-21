export const ACCESS_COOKIE = "kunitrust_access";
export const ACCESS_MAX_AGE_SEC = 60 * 60 * 12;

export type AccessRole = "admin" | "user";

export function accessRoleLabel(role: AccessRole): string {
  return role === "admin" ? "관리자" : "사용자";
}

export function canUploadExcel(role: AccessRole | null | undefined): boolean {
  return role === "admin";
}

export function isExcelUploadApiPath(pathname: string): boolean {
  if (!pathname.startsWith("/api/ingest/")) return false;
  return pathname.includes("/upload") || pathname.endsWith("/consolidate");
}

export function getAccessSecret(): string {
  const explicit = process.env.KUNITRUST_AUTH_SECRET?.trim();
  if (explicit) return explicit;
  const admin = process.env.KUNITRUST_ADMIN_PASSWORD ?? "";
  const user = process.env.KUNITRUST_USER_PASSWORD ?? "";
  return `kunitrust:${admin}:${user}`;
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return toHex(sig);
}

export async function createAccessToken(
  role: AccessRole,
  maxAgeSec = ACCESS_MAX_AGE_SEC,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload = `${role}.${exp}`;
  const sig = await hmacHex(getAccessSecret(), payload);
  return `${payload}.${sig}`;
}

export async function parseAccessToken(
  token: string | undefined | null,
): Promise<AccessRole | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, expStr, sig] = parts;
  if (role !== "admin" && role !== "user") return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const expected = await hmacHex(getAccessSecret(), `${role}.${expStr}`);
  if (!timingSafeEqualString(sig, expected)) return null;
  return role;
}
