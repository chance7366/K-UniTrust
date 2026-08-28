/**
 * Vercel Blob 인증.
 * 대시보드에 BLOB_STORE_ID만 있고 BLOB_READ_WRITE_TOKEN이 없을 수 있다.
 * 그 경우 배포 환경의 OIDC + store id로 SDK가 인증한다.
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

/** Blob overlay: Vercel runtime OIDC, or an explicit read-write token locally. */
export function shouldReadRemoteCsvStore(): boolean {
  return Boolean(blobReadWriteToken() || process.env.VERCEL);
}
