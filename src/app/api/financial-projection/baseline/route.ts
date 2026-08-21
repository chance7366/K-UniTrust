import { NextResponse } from "next/server";

import { loadFinancialProjectionBaseline } from "@/lib/competitiveness-analysis/financial-projection/load-live";
import { normalizeSchoolCodeText } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { isFpAnalysisYear } from "@/lib/competitiveness-analysis/financial-projection/years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      schoolCodes?: unknown;
      analysisYear?: unknown;
    };
    const schoolCodes = Array.isArray(body.schoolCodes)
      ? body.schoolCodes
          .map((code) => normalizeSchoolCodeText(String(code ?? "")))
          .filter(Boolean)
      : [];
    const yearRaw = Number(body.analysisYear);
    const analysisYear = isFpAnalysisYear(yearRaw) ? yearRaw : undefined;

    const universities = await loadFinancialProjectionBaseline({
      schoolCodes,
      analysisYear,
    });
    const savedYear =
      analysisYear ?? universities[0]?.analysisYear ?? null;
    return NextResponse.json({
      analysisYear: savedYear,
      universities,
      rowCount: universities.length,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "재정추계 기초자료 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
