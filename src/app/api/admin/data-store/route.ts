import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { canUploadExcel } from "@/lib/auth/access";
import { readAccessRole } from "@/lib/auth/session";
import {
  bumpCsvStoreRevision,
  getCsvStoreFile,
  putCsvStoreFile,
  getStorePathText,
  putStorePath,
} from "@/lib/csv/blob-store";
import { CSV_DIR } from "@/lib/csv/paths";
import {
  assertStoreObjectName,
  encodeStoreBody,
  readEncodedStoreRequest,
} from "@/lib/prod-store-sync";
import { shouldReadRemoteCsvStore } from "@/lib/vercel-blob-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseRequest(request: Request): {
  bucket: "csv" | "data";
  name: string;
} | null {
  const url = new URL(request.url);
  const bucket = url.searchParams.get("bucket");
  const name = url.searchParams.get("name") ?? "";
  if (bucket !== "csv" && bucket !== "data") return null;
  try {
    assertStoreObjectName(bucket, name);
  } catch {
    return null;
  }
  return { bucket, name };
}

function binaryResponse(
  payload: string | Uint8Array,
  headers: Record<string, string>,
): NextResponse {
  return new NextResponse(payload as BodyInit, { headers });
}

async function readCsvFallback(fileName: string): Promise<string | null> {
  try {
    return await readFile(path.join(CSV_DIR, fileName), "utf8");
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const role = await readAccessRole();
  if (!role) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = parseRequest(request);
  if (!parsed) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (parsed.bucket === "csv") {
    // Prefer Git-deployed disk; Blob only when BLOB_CSV_READ_FALLBACK=1.
    const disk = await readCsvFallback(parsed.name);
    const remote =
      disk == null && shouldReadRemoteCsvStore()
        ? await getCsvStoreFile(parsed.name)
        : null;
    const body = disk ?? remote;
    if (body == null) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 404 });
    }
    const { body: payload, headers } = encodeStoreBody(
      body,
      "text/plain; charset=utf-8",
    );
    return binaryResponse(payload, headers);
  }

  const remote = await getStorePathText(`data/${parsed.name}`);
  if (remote == null) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 404 });
  }
  const { body: payload, headers } = encodeStoreBody(
    remote,
    "application/json; charset=utf-8",
  );
  return binaryResponse(payload, headers);
}

export async function PUT(request: Request) {
  const role = await readAccessRole();
  if (!canUploadExcel(role)) {
    return NextResponse.json(
      { error: "관리자만 저장소를 갱신할 수 있습니다." },
      { status: 403 },
    );
  }

  const parsed = parseRequest(request);
  if (!parsed) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const body = await readEncodedStoreRequest(request);
  if (!body) {
    return NextResponse.json({ error: "본문이 비었습니다." }, { status: 400 });
  }

  if (parsed.bucket === "csv") {
    const contentType = parsed.name.endsWith(".json")
      ? "application/json; charset=utf-8"
      : parsed.name.endsWith(".txt")
        ? "text/plain; charset=utf-8"
        : "text/csv; charset=utf-8";
    await putCsvStoreFile(parsed.name, body, contentType);
    if (parsed.name !== "_revision.txt" && shouldReadRemoteCsvStore()) {
      await bumpCsvStoreRevision();
    }
    return NextResponse.json({ ok: true });
  }

  await putStorePath(
    `data/${parsed.name}`,
    body,
    "application/json; charset=utf-8",
  );
  return NextResponse.json({ ok: true });
}
