import { NextResponse } from "next/server";

import {
  parseAnalysisYearParam,
  saveEditionResults,
  type SaveEditionResultsInput,
} from "@/lib/competitiveness-analysis/editions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ year: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { year: yearParam } = await context.params;
    const analysisYear = parseAnalysisYearParam(yearParam);
    if (analysisYear == null) {
      return NextResponse.json({ error: "유효하지 않은 분석연도입니다." }, { status: 400 });
    }

    const body = (await request.json()) as SaveEditionResultsInput;
    const edition = await saveEditionResults(analysisYear, body);
    return NextResponse.json({ ok: true, edition });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석결과 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
