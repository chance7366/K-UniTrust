/** Node Buffer → fetch Response body (BodyInit) */
export function bufferResponseBody(buffer: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buffer);
}
