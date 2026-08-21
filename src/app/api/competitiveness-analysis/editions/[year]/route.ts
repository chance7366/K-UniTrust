import { NextResponse } from "next/server";

import {
  getEditionFull,
  getOrCreateEdition,
  parseAnalysisYearParam,
  saveEditionSettings,
} from "@/lib/competitiveness-analysis/editions-db";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

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

    const edition =
      (await getEditionFull(analysisYear)) ??
      (await getOrCreateEdition(analysisYear));

    return NextResponse.json({ edition });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석연도 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { year: yearParam } = await context.params;
    const analysisYear = parseAnalysisYearParam(yearParam);
    if (analysisYear == null) {
      return NextResponse.json({ error: "유효하지 않은 분석연도입니다." }, { status: 400 });
    }

    const body = (await request.json()) as {
      settings?: CompetitivenessSettings;
    };
    if (!body.settings) {
      return NextResponse.json({ error: "settings가 필요합니다." }, { status: 400 });
    }

    const edition = await saveEditionSettings(analysisYear, body.settings);
    return NextResponse.json({ ok: true, edition });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "기본설정 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
