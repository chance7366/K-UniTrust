import { NextResponse } from "next/server";

import { loadEditionTrendSeries } from "@/lib/competitiveness-analysis/editions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const series = await loadEditionTrendSeries();
    return NextResponse.json({ series });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "추세 데이터 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
