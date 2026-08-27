import { NextResponse } from "next/server";

import { loadStudentFillFreshmanSchools, listStudentFillSourceYears } from "@/lib/analysis/student-fill-analysis/load-freshman";
import { readStudentFillEdition } from "@/lib/analysis/student-fill-analysis/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const years = await listStudentFillSourceYears();
    const requested = Number(url.searchParams.get("year"));
    const displayYear =
      Number.isFinite(requested) && years.includes(requested)
        ? requested
        : (years[0] ?? null);
    const schools =
      displayYear != null ? await loadStudentFillFreshmanSchools(displayYear) : [];
    const edition =
      displayYear != null ? await readStudentFillEdition(displayYear) : null;

    return NextResponse.json({
      years,
      displayYear,
      lastRunAt: edition?.lastRunAt ?? null,
      schoolCount: schools.length,
      universityCount: schools.filter((row) => row.schoolDivision === "대학").length,
      juniorCollegeCount: schools.filter((row) => row.schoolDivision === "전문대학")
        .length,
      schools,
      sourceLabel: "대학현황 › 대학알리미 › 신입생충원 (대학전문)",
      sourceHref: "/analysis/univ-map?tab=freshman-enrollment",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "대상대학 목록을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
