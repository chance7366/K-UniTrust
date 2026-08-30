import { NextResponse } from "next/server";

import { requireAdminReportGenerate } from "@/lib/auth/require-admin";
import { buildStudentFillComprehensiveGuidelines } from "@/lib/analysis/student-fill-analysis/build-comprehensive-guidelines";
import {
  comprehensiveFilterKey,
  parseSfaEstbFilter,
  parseSfaMetroFilter,
  parseSfaSchoolKindFilter,
  type SfaComprehensiveFilter,
} from "@/lib/analysis/student-fill-analysis/comprehensive-filter";
import { generateStudentFillComprehensiveReport } from "@/lib/analysis/student-fill-analysis/generate-comprehensive-report";
import {
  readStudentFillComprehensiveReport,
  writeStudentFillComprehensiveReport,
} from "@/lib/analysis/student-fill-analysis/store";
import { REPORT_PDF_PRINT_GUIDANCE } from "@/lib/reports/report-pdf-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function injectReportToolbar(html: string): string {
  const toolbar = `<div class="report-view-toolbar no-print" style="position:sticky;top:0;z-index:9999;display:flex;gap:8px;justify-content:flex-end;padding:8px 12px;background:#1e293b;color:#fff;font-size:13px;">
  <button type="button" onclick="window.print()" style="padding:6px 12px;border-radius:6px;border:none;background:#2a7a55;color:#fff;cursor:pointer;">인쇄 / PDF 저장</button>
  <span style="opacity:0.85;font-size:12px;">Ctrl+P → PDF로 저장</span>
</div>
<style>@media print { .no-print { display: none !important; } }</style>`;
  if (html.includes('class="report-view-toolbar"')) return html;
  return html.replace("<body>", `<body>${toolbar}`);
}

function parseFilter(source: URLSearchParams | Record<string, unknown>): SfaComprehensiveFilter | null {
  const yearRaw = source instanceof URLSearchParams ? source.get("year") : source.analysisYear;
  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  const pick = (key: string) =>
    source instanceof URLSearchParams ? source.get(key) : source[key];
  return {
    analysisYear: year,
    metro: parseSfaMetroFilter(pick("metro")),
    estb: parseSfaEstbFilter(pick("estb")),
    schoolKind: parseSfaSchoolKindFilter(pick("schoolKind") ?? pick("kind")),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("guidelines") === "1") {
      const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
      const analysisYear =
        Number.isInteger(year) && year >= 2000 && year <= 2100
          ? year
          : new Date().getFullYear();
      return NextResponse.json({
        text: buildStudentFillComprehensiveGuidelines(analysisYear),
      });
    }

    const filter = parseFilter(url.searchParams);
    if (!filter) {
      return NextResponse.json(
        { error: "분석연도가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    const key = comprehensiveFilterKey(filter);
    const format = url.searchParams.get("format");
    if (format === "html") {
      const { readFile } = await import("fs/promises");
      const { join } = await import("path");
      const liveHtml = await readFile(
        join(process.cwd(), "public/reports/sfa-gemini-comprehensive.html"),
        "utf8",
      );
      return new NextResponse(liveHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    if (format === "pdf") {
      try {
        const { htmlToPdfBuffer } = await import(
          "@/lib/competitiveness-analysis/university-report/html-to-pdf"
        );
        const { readFile } = await import("fs/promises");
        const { join } = await import("path");
        const liveHtml = await readFile(
          join(process.cwd(), "public/reports/sfa-gemini-comprehensive.html"),
          "utf8",
        );
          const pdf = await htmlToPdfBuffer(liveHtml, { landscape: false });
        const filename = `${key}_student-fill-comprehensive.pdf`;
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          },
        });
      } catch {
        return NextResponse.json(
          { error: REPORT_PDF_PRINT_GUIDANCE },
          { status: 501 },
        );
      }
    }

    const report = await readStudentFillComprehensiveReport(filter.analysisYear, key);
    if (!report) {
      return NextResponse.json(
        { error: "이 분석조건의 종합보고서가 아직 없습니다.", missing: true },
        { status: 404 },
      );
    }

    return NextResponse.json({
      report: {
        analysisYear: report.analysisYear,
        filterKey: report.filterKey,
        filter: report.filter,
        filterLabel: report.filterLabel,
        schoolCount: report.schoolCount,
        generatedAt: report.generatedAt,
        guidelinesVersion: report.guidelinesVersion,
        current: report.current,
        trend: report.trend,
        diagnosis: report.diagnosis,
        actions: report.actions,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "종합보고서를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminReportGenerate();
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const filter = parseFilter(body);
    if (!filter) {
      return NextResponse.json(
        { error: "분석연도가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    const report = await generateStudentFillComprehensiveReport(filter);
    if (!report) {
      return NextResponse.json(
        { error: `${filter.analysisYear}년 분석실행 저장본이 없거나 해당 조건의 대학이 없습니다.` },
        { status: 404 },
      );
    }
    await writeStudentFillComprehensiveReport(report);
    return NextResponse.json({
      ok: true,
      report: {
        analysisYear: report.analysisYear,
        filterKey: report.filterKey,
        filterLabel: report.filterLabel,
        schoolCount: report.schoolCount,
        generatedAt: report.generatedAt,
        guidelinesVersion: report.guidelinesVersion,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "종합보고서를 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}