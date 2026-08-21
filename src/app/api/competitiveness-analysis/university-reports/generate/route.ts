import { NextResponse } from "next/server";

import { requireAdminUpload } from "@/lib/auth/require-admin";
import { generateUniversityReport } from "@/lib/competitiveness-analysis/university-report/generate-university-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = await requireAdminUpload();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      analysisYear?: number;
      schoolCodeStd?: string;
    };

    const analysisYear = body.analysisYear;
    const schoolCodeStd = body.schoolCodeStd?.trim();

    if (!analysisYear || !Number.isFinite(analysisYear)) {
      return NextResponse.json(
        { error: "analysisYear가 필요합니다." },
        { status: 400 },
      );
    }
    if (!schoolCodeStd) {
      return NextResponse.json(
        { error: "schoolCodeStd가 필요합니다." },
        { status: 400 },
      );
    }

    const result = await generateUniversityReport({
      analysisYear,
      schoolCodeStd,
    });

    return NextResponse.json({
      ok: true,
      meta: result.meta,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
