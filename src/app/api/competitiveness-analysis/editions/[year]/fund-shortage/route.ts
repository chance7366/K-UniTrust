import { NextResponse } from "next/server";

import {
  applyFundShortageToEdition,
  parseAnalysisYearParam,
} from "@/lib/competitiveness-analysis/editions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ year: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { year: yearParam } = await context.params;
    const analysisYear = parseAnalysisYearParam(yearParam);
    if (analysisYear == null) {
      return NextResponse.json({ error: "유효하지 않은 분석연도입니다." }, { status: 400 });
    }

    const edition = await applyFundShortageToEdition(analysisYear);
    const fundSecureYear =
      edition.settings.indicatorYears["fund-secure-rate"] ?? "—";
    const count = edition.settings.targetUniversities.filter(
      (r) => r.fundShortage === "해당",
    ).length;

    return NextResponse.json({
      ok: true,
      edition,
      fundSecureYear,
      fundShortageCount: count,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "자금부족대학 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
