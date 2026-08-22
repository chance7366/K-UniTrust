export type ReportDomain = "competitiveness" | "financial-projection";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function isBlobReportStorageEnabled(): boolean {
  return Boolean(blobToken());
}

function reportPathname(
  domain: ReportDomain,
  analysisYear: number,
  schoolCodeStd: string,
  fileName: string,
): string {
  return `reports/${domain}/${analysisYear}/${schoolCodeStd}/${fileName}`;
}

export async function putReportTextFile(args: {
  domain: ReportDomain;
  analysisYear: number;
  schoolCodeStd: string;
  fileName: string;
  content: string;
}): Promise<void> {
  const token = blobToken();
  if (!token) return;

  const { put } = await import("@vercel/blob");
  await put(
    reportPathname(
      args.domain,
      args.analysisYear,
      args.schoolCodeStd,
      args.fileName,
    ),
    args.content,
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: args.fileName.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/json; charset=utf-8",
    },
  );
}

export async function putReportBinaryFile(args: {
  domain: ReportDomain;
  analysisYear: number;
  schoolCodeStd: string;
  fileName: string;
  content: Buffer;
}): Promise<void> {
  const token = blobToken();
  if (!token) return;

  const { put } = await import("@vercel/blob");
  await put(
    reportPathname(
      args.domain,
      args.analysisYear,
      args.schoolCodeStd,
      args.fileName,
    ),
    args.content,
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: "application/pdf",
    },
  );
}

export async function getReportTextFile(args: {
  domain: ReportDomain;
  analysisYear: number;
  schoolCodeStd: string;
  fileName: string;
}): Promise<string | null> {
  const token = blobToken();
  if (!token) return null;

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(
      reportPathname(
        args.domain,
        args.analysisYear,
        args.schoolCodeStd,
        args.fileName,
      ),
      { access: "private", token },
    );
    if (!result) return null;
    if ("text" in result && typeof result.text === "function") {
      return await result.text();
    }
    if ("stream" in result && result.stream) {
      return await new Response(result.stream).text();
    }
    return null;
  } catch {
    return null;
  }
}

export async function getReportBinaryFile(args: {
  domain: ReportDomain;
  analysisYear: number;
  schoolCodeStd: string;
  fileName: string;
}): Promise<Buffer | null> {
  const token = blobToken();
  if (!token) return null;

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(
      reportPathname(
        args.domain,
        args.analysisYear,
        args.schoolCodeStd,
        args.fileName,
      ),
      { access: "private", token },
    );
    if (!result) return null;
    const bytes =
      "arrayBuffer" in result && typeof result.arrayBuffer === "function"
        ? await result.arrayBuffer()
        : "stream" in result && result.stream
          ? await new Response(result.stream).arrayBuffer()
          : null;
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}

export async function listReportSchoolCodes(args: {
  domain: ReportDomain;
  analysisYear: number;
}): Promise<string[]> {
  const token = blobToken();
  if (!token) return [];

  try {
    const { list } = await import("@vercel/blob");
    const prefix = `reports/${args.domain}/${args.analysisYear}/`;
    const { blobs } = await list({ prefix, token });
    const codes = new Set<string>();
    for (const blob of blobs) {
      const match = blob.pathname.match(
        /^reports\/[^/]+\/\d+\/([^/]+)\/meta\.json$/,
      );
      if (match?.[1]) codes.add(match[1]);
    }
    return [...codes];
  } catch {
    return [];
  }
}
