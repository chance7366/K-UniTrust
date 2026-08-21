import { NextResponse } from "next/server";

import { runPostRunValidation } from "@/lib/competitiveness-analysis/post-run-validation/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { analysisYear?: number };
    const analysisYear = body.analysisYear;

    if (!analysisYear || !Number.isInteger(analysisYear)) {
      return NextResponse.json(
        { error: "analysisYear(분석연도)가 필요합니다." },
        { status: 400 },
      );
    }

    const report = await runPostRunValidation(analysisYear, {
      print: false,
      save: true,
      appendLog: true,
    });

    return NextResponse.json({
      ok: report.ok,
      report,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "실행 후 검증 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
