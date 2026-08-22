import { NextResponse } from "next/server";

import {
  loadUniversityReportHtml,
  loadUniversityReportMeta,
} from "@/lib/competitiveness-analysis/university-report/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function injectReportToolbar(
  html: string,
  analysisYear: number,
  schoolCodeStd: string,
): string {
  const pdfUrl = `/api/competitiveness-analysis/university-reports/${analysisYear}/${encodeURIComponent(schoolCodeStd)}?format=pdf`;
  const toolbar = `<div class="report-view-toolbar no-print" style="position:sticky;top:0;z-index:9999;display:flex;gap:8px;justify-content:flex-end;padding:8px 12px;background:#1e293b;color:#fff;font-size:13px;">
  <button type="button" onclick="window.print()" style="padding:6px 12px;border-radius:6px;border:none;background:#2563eb;color:#fff;cursor:pointer;">인쇄</button>
  <a href="${pdfUrl}" style="padding:6px 12px;border-radius:6px;background:#ea580c;color:#fff;text-decoration:none;">PDF 저장</a>
</div>`;
  if (html.includes('class="report-view-toolbar"')) return html;
  return html.replace("<body>", `<body>${toolbar}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ year: string; schoolCode: string }> },
) {
  try {
    const { year, schoolCode } = await context.params;
    const analysisYear = Number(year);
    if (!Number.isFinite(analysisYear)) {
      return NextResponse.json({ error: "유효하지 않은 연도입니다." }, { status: 400 });
    }

    const meta = await loadUniversityReportMeta(analysisYear, schoolCode);
    if (!meta) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format === "html") {
      const html = await loadUniversityReportHtml(analysisYear, schoolCode);
      if (!html) {
        return NextResponse.json(
          { error: "보고서 HTML을 찾을 수 없습니다." },
          { status: 404 },
        );
      }
      const withToolbar = injectReportToolbar(html, analysisYear, schoolCode);
      return new NextResponse(withToolbar, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    if (format === "pdf") {
      try {
        const { ensureUniversityReportPdf } = await import(
          "@/lib/competitiveness-analysis/university-report/ensure-university-report-pdf"
        );
        const { universityReportPdfFilename } = await import(
          "@/lib/competitiveness-analysis/university-report/html-to-pdf"
        );
        const pdf = await ensureUniversityReportPdf(analysisYear, schoolCode);
        const filename = universityReportPdfFilename({
          analysisYear: meta.analysisYear,
          schoolCodeStd: meta.schoolCodeStd,
          schoolName: meta.schoolName,
        });
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "PDF 생성 중 오류가 발생했습니다.";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({ meta });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
