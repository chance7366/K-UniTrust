import { NextResponse } from "next/server";

import {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  buildStudentFillReportHtml,
} from "@/lib/analysis/student-fill-analysis/diagnosis";
import { STUDENT_FILL_REPORT_GUIDELINES_VERSION } from "@/lib/analysis/student-fill-analysis/generation-guidelines";
import { attachStudentFillAux } from "@/lib/analysis/student-fill-analysis/load-join";
import {
  readStudentFillEdition,
  writeStudentFillUniversityReport,
} from "@/lib/analysis/student-fill-analysis/store";
import { padSchoolCode } from "@/lib/ingest/school-code-campus-index";
import { requireAdminReportGenerate } from "@/lib/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const denied = await requireAdminReportGenerate();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      analysisYear?: unknown;
      schoolCodeStd?: unknown;
    };
    const year = Number(body.analysisYear);
    const code = padSchoolCode(String(body.schoolCodeStd ?? ""));
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !code) {
      return NextResponse.json({ error: "분석연도 또는 학교코드가 올바르지 않습니다." }, { status: 400 });
    }
    const stored = await readStudentFillEdition(year);
    if (!stored) {
      return NextResponse.json(
        { error: `${year}년 분석결과가 없습니다. 기본설정에서 분석실행하세요.` },
        { status: 400 },
      );
    }
    const schools = await attachStudentFillAux(stored.schools, year);
    const school = schools.find((row) => padSchoolCode(row.schoolCodeStd) === code);
    if (!school) {
      return NextResponse.json({ error: "해당 연도 분석결과에 없는 학교입니다." }, { status: 404 });
    }
    const diagnosis = buildStudentFillDiagnosis(school);
    const actions = buildStudentFillActions(school);
    const generatedAt = new Date().toLocaleString("ko-KR");
    const report = {
      analysisYear: year,
      schoolCodeStd: code,
      schoolName: school.schoolName,
      generatedAt,
      guidelinesVersion: STUDENT_FILL_REPORT_GUIDELINES_VERSION,
      diagnosis,
      actions,
      html: buildStudentFillReportHtml({
        schoolName: school.schoolName,
        analysisYear: year,
        generatedAt,
        diagnosis,
        actions,
      }),
    };
    await writeStudentFillUniversityReport(report);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서를 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
