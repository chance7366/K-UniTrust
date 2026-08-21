import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import {
  getUniversityLogoPath,
  universityLogoMime,
} from "@/lib/university-logos-dir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ index: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { index: indexParam } = await context.params;
    const index = Number(indexParam);
    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: "유효하지 않은 index" }, { status: 400 });
    }

    const resolved = await getUniversityLogoPath(index);
    if (!resolved) {
      return NextResponse.json({ error: "로고를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await readFile(resolved.filePath);
    return new NextResponse(body, {
      headers: {
        "Content-Type": universityLogoMime(resolved.fileName),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "로고 파일을 읽지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
