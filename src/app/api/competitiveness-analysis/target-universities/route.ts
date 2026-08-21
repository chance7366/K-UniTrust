import { NextResponse } from "next/server";

import { toTargetUniversityRow } from "@/lib/analysis/competitiveness-target-univ-mock-view";
import { loadCompetitivenessTargetUnivMock } from "@/lib/data/competitiveness-target-univ-mock";
import {
  getEditionFull,
  getOrCreateEdition,
  parseAnalysisYearParam,
} from "@/lib/competitiveness-analysis/editions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisYear =
      parseAnalysisYearParam(searchParams.get("year")) ??
      new Date().getFullYear();

    if (searchParams.get("source") === "live") {
      const data = await loadCompetitivenessTargetUnivMock({
        year: analysisYear,
      });
      const rows = [
        ...data.allCohortRows.university,
        ...data.allCohortRows["junior-college"],
      ].map(toTargetUniversityRow);
      return NextResponse.json({
        analysisYear,
        rows,
        rowCount: rows.length,
        source: "live",
      });
    }

    const edition =
      (await getEditionFull(analysisYear)) ??
      (await getOrCreateEdition(analysisYear));

    const rows = edition.settings.targetUniversities;
    return NextResponse.json({
      analysisYear,
      rows,
      uploadedAt: edition.settingsSavedAt,
      rowCount: rows.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "대상대학 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
