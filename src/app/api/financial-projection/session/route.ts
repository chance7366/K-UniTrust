import { NextResponse } from "next/server";

import {
  assertFpYear,
  readFpServerSession,
} from "@/lib/competitiveness-analysis/financial-projection/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = assertFpYear(Number(url.searchParams.get("year")));
    if (year == null) {
      return NextResponse.json({ error: "분석연도가 올바르지 않습니다." }, { status: 400 });
    }
    const session = await readFpServerSession(year);
    return NextResponse.json({
      analysisYear: year,
      session,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "재정추계 세션을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
