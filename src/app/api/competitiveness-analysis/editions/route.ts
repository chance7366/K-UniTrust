import { NextResponse } from "next/server";

import {
  createEdition,
  listEditionSummaries,
} from "@/lib/competitiveness-analysis/editions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const editions = await listEditionSummaries();
    return NextResponse.json({ editions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석연도 목록 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { analysisYear?: number };
    const year = body.analysisYear;
    if (!year || !Number.isInteger(year)) {
      return NextResponse.json(
        { error: "analysisYear(정수)가 필요합니다." },
        { status: 400 },
      );
    }

    const { edition, copiedFromYear } = await createEdition(year);
    return NextResponse.json({ ok: true, edition, copiedFromYear });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석연도 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
