import { NextResponse } from "next/server";

import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import { loadStep1RawIndicatorResults } from "@/lib/competitiveness-analysis/indicator-value-loader";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      settings?: CompetitivenessSettings;
    };
    const settings = body.settings;

    if (!settings?.targetUniversities?.length) {
      return NextResponse.json(
        { error: "대상대학이 없습니다. 기본설정에서 대상대학을 업로드하세요." },
        { status: 400 },
      );
    }

    const indicators = getCompetitivenessIndicators();
    const rawResults = await loadStep1RawIndicatorResults(settings, indicators);
    const lastRunAt = new Date().toLocaleString("ko-KR");

    return NextResponse.json({ ok: true, rawResults, lastRunAt });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "1단계 실행 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
