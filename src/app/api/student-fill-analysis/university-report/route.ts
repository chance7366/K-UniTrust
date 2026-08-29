import { NextResponse } from "next/server";

import {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  buildStudentFillReportHtml,
} from "@/lib/analysis/student-fill-analysis/diagnosis";
import { STUDENT_FILL_REPORT_GUIDELINES_VERSION } from "@/lib/analysis/student-fill-analysis/generation-guidelines";
import { loadStudentFillUniversityPeer } from "@/lib/analysis/student-fill-analysis/load-university-peer";
import {
  readStudentFillUniversityReport,
  writeStudentFillUniversityReport,
} from "@/lib/analysis/student-fill-analysis/store";
import { padSchoolCode } from "@/lib/ingest/school-code-campus-index";
import { requireAdminReportGenerate } from "@/lib/auth/require-admin";

function injectReportToolbar(html: string): string {
  const toolbar = `<div class="report-view-toolbar no-print" style="position:sticky;top:0;z-index:9999;display:flex;gap:8px;justify-content:flex-end;padding:8px 12px;background:#1e293b;color:#fff;font-size:13px;">
  <button type="button" onclick="window.print()" style="padding:6px 12px;border-radius:6px;border:none;background:#2563eb;color:#fff;cursor:pointer;">인쇄 / PDF 저장</button>
  <span style="opacity:0.85;font-size:12px;">Ctrl+P → PDF로 저장</span>
</div>
<style>@media print { .no-print { display: none !important; } }</style>`;
  if (html.includes('class="report-view-toolbar"')) return html;
  return html.replace("<body>", `<body>${toolbar}`);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function buildHtmlFromContext(
  schoolName: string,
  analysisYear: number,
  generatedAt: string,
  diagnosis: ReturnType<typeof buildStudentFillDiagnosis>,
  actions: ReturnType<typeof buildStudentFillActions>,
  ctx: NonNullable<Awaited<ReturnType<typeof loadStudentFillUniversityPeer>>>,
) {
  return buildStudentFillReportHtml({
    schoolName,
    analysisYear,
    generatedAt,
    diagnosis,
    actions,
    school: ctx.school,
    lastRunAt: ctx.lastRunAt,
    peer: ctx.peer,
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const code = padSchoolCode(String(url.searchParams.get("code") ?? ""));
    const format = url.searchParams.get("format");
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !code) {
      return NextResponse.json(
        { error: "분석연도 또는 학교코드가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    const report = await readStudentFillUniversityReport(year, code);
    if (!report) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (format === "html") {
      const ctx = await loadStudentFillUniversityPeer({
        analysisYear: year,
        schoolCodeStd: code,
      });
      const html = ctx
        ? buildHtmlFromContext(
            report.schoolName,
            report.analysisYear,
            report.generatedAt,
            report.diagnosis,
            report.actions,
            ctx,
          )
        : buildStudentFillReportHtml({
            schoolName: report.schoolName,
            analysisYear: report.analysisYear,
            generatedAt: report.generatedAt,
            diagnosis: report.diagnosis,
            actions: report.actions,
          });
      return new NextResponse(injectReportToolbar(html), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ report });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      return NextResponse.json(
        { error: "분석연도 또는 학교코드가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    const ctx = await loadStudentFillUniversityPeer({
      analysisYear: year,
      schoolCodeStd: code,
    });
    if (!ctx) {
      return NextResponse.json(
        { error: `${year}년 분석결과에 없는 학교이거나 분석실행이 없습니다.` },
        { status: 404 },
      );
    }
    const diagnosis = buildStudentFillDiagnosis(ctx.school, ctx.peer);
    const actions = buildStudentFillActions(ctx.school, ctx.peer);
    const generatedAt = new Date().toLocaleString("ko-KR");
    const report = {
      analysisYear: year,
      schoolCodeStd: code,
      schoolName: ctx.school.schoolName,
      generatedAt,
      guidelinesVersion: STUDENT_FILL_REPORT_GUIDELINES_VERSION,
      diagnosis,
      actions,
      html: buildHtmlFromContext(
        ctx.school.schoolName,
        year,
        generatedAt,
        diagnosis,
        actions,
        ctx,
      ),
    };
    await writeStudentFillUniversityReport(report);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서를 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
