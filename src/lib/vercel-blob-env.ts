/**
 * Vercel Blob 인증.
 * 대시보드에 BLOB_STORE_ID만 있고 BLOB_READ_WRITE_TOKEN이 없을 수 있다.
 * 그 경우 배포 환경의 OIDC + store id로 SDK가 인증한다.
 *
 * CSV 읽기 정책 (Hobby Simple Ops 절약):
 * - 기본: Git에 포함된 data/csv(배포 디스크)만 읽는다. Blob GET을 하지 않는다.
 * - 업로드(쓰기)는 Blob에 그대로 둔다.
 * - 디스크에 없고 Blob만 있는 비상 시에만 BLOB_CSV_READ_FALLBACK=1 로 Blob 읽기를 켠다.
 */
export function blobReadWriteToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function isVercelBlobEnabled(): boolean {
  return Boolean(
    blobReadWriteToken() || process.env.BLOB_STORE_ID?.trim(),
  );
}

export function blobAuthOptions(): { token?: string } {
  const token = blobReadWriteToken();
  return token ? { token } : {};
}

/**
 * CSV·meta 를 Blob에서 읽을지.
 * 기본 false → 배포분(data/csv)만 사용. 비상 시에만 BLOB_CSV_READ_FALLBACK=1.
 */
export function shouldReadRemoteCsvStore(): boolean {
  return process.env.BLOB_CSV_READ_FALLBACK?.trim() === "1";
}

/**
 * data/json·보고서 스냅샷 등 persistent 텍스트.
 * Git에 없을 수 있어 Vercel/토큰 환경에서는 Blob 폴백을 허용한다.
 */
export function shouldReadRemotePersistentStore(): boolean {
  return Boolean(blobReadWriteToken() || process.env.VERCEL);
}
