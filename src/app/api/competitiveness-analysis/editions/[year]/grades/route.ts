import { NextResponse } from "next/server";

import { getEditionFull, parseAnalysisYearParam } from "@/lib/competitiveness-analysis/editions-db";
import { competitivenessGradeBySchoolCode } from "@/lib/competitiveness-analysis/run-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ year: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { year: yearParam } = await context.params;
    const analysisYear = parseAnalysisYearParam(yearParam);
    if (analysisYear == null) {
      return NextResponse.json({ error: "유효하지 않은 분석연도입니다." }, { status: 400 });
    }

    const edition = await getEditionFull(analysisYear);
    const map = competitivenessGradeBySchoolCode(edition?.results.runResults ?? []);
    const grades: Record<string, { grade: string | null; label: string }> = {};
    for (const [code, value] of map) {
      grades[code] = { grade: value.grade, label: value.label };
    }
    return NextResponse.json({ grades });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "진단등급 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
