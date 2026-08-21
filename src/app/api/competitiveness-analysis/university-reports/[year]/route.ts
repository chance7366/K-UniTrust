import { NextResponse } from "next/server";

import { listUniversityReportsForYear } from "@/lib/competitiveness-analysis/university-report/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ year: string }> },
) {
  try {
    const { year } = await context.params;
    const analysisYear = Number(year);
    if (!Number.isFinite(analysisYear)) {
      return NextResponse.json({ error: "유효하지 않은 연도입니다." }, { status: 400 });
    }

    const reports = await listUniversityReportsForYear(analysisYear);
    return NextResponse.json({ analysisYear, reports });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서 목록 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
