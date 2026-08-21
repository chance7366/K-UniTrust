import { NextResponse } from "next/server";

import { loadFinancialProjectionBootstrap } from "@/lib/competitiveness-analysis/financial-projection/load-live";
import { isFpAnalysisYear } from "@/lib/competitiveness-analysis/financial-projection/years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const yearRaw = Number(url.searchParams.get("year"));
    const analysisYear = isFpAnalysisYear(yearRaw) ? yearRaw : undefined;
    const data = await loadFinancialProjectionBootstrap({ analysisYear });
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "재정추계 기본설정 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
