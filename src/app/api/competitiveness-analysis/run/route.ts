import { NextResponse } from "next/server";

import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import { resolveStep3IndicatorIds } from "@/lib/competitiveness-analysis/analysis-policy";
import { buildRunPayload } from "@/lib/competitiveness-analysis/compute-run";
import {
  loadNationalDistributionsForSettings,
  runStep2Analysis,
} from "@/lib/competitiveness-analysis/compute-step2";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";
import {
  formatWeightValidationError,
  validateCompetitivenessWeights,
} from "@/lib/competitiveness-analysis/validate-competitiveness-weights";

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
    const weightIssues = validateCompetitivenessWeights(settings, indicators);
    if (weightIssues.length) {
      return NextResponse.json(
        { error: formatWeightValidationError(weightIssues) },
        { status: 400 },
      );
    }

    const step2 = await runStep2Analysis(settings, indicators);
    const step3Ids = resolveStep3IndicatorIds(settings, indicators);
    const nationalDists = await loadNationalDistributionsForSettings(
      settings,
      indicators,
      step3Ids,
    );
    const lastRunAt = new Date().toLocaleString("ko-KR");
    const fullPayload = buildRunPayload(
      settings,
      indicators,
      step2.rawResults,
      nationalDists,
      lastRunAt,
    );

    return NextResponse.json({
      ok: true,
      rawResults: step2.rawResults,
      indexResults: step2.indexResults,
      runResults: fullPayload.runResults,
      lastRunAt,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석 실행 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
