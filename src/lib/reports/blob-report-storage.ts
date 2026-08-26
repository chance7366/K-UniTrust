import {
  blobAuthOptions,
  isVercelBlobEnabled,
} from "@/lib/vercel-blob-env";

export type ReportDomain = "competitiveness" | "financial-projection";

export function isBlobReportStorageEnabled(): boolean {
  return isVercelBlobEnabled();
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
  if (!isBlobReportStorageEnabled()) return;

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
      contentType: args.fileName.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/json; charset=utf-8",
      ...blobAuthOptions(),
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
  if (!isBlobReportStorageEnabled()) return;

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
      contentType: "application/pdf",
      ...blobAuthOptions(),
    },
  );
}

export async function getReportTextFile(args: {
  domain: ReportDomain;
  analysisYear: number;
  schoolCodeStd: string;
  fileName: string;
}): Promise<string | null> {
  if (!isBlobReportStorageEnabled()) return null;

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(
      reportPathname(
        args.domain,
        args.analysisYear,
        args.schoolCodeStd,
        args.fileName,
      ),
      { access: "private", useCache: false, ...blobAuthOptions() },
    );
    if (!result?.stream) return null;
    return await new Response(result.stream).text();
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
  if (!isBlobReportStorageEnabled()) return null;

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(
      reportPathname(
        args.domain,
        args.analysisYear,
        args.schoolCodeStd,
        args.fileName,
      ),
      { access: "private", useCache: false, ...blobAuthOptions() },
    );
    if (!result?.stream) return null;
    const bytes = await new Response(result.stream).arrayBuffer();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

export async function listReportSchoolCodes(args: {
  domain: ReportDomain;
  analysisYear: number;
}): Promise<string[]> {
  if (!isBlobReportStorageEnabled()) return [];

  try {
    const { list } = await import("@vercel/blob");
    const prefix = `reports/${args.domain}/${args.analysisYear}/`;
    const { blobs } = await list({ prefix, ...blobAuthOptions() });
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
