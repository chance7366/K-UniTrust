import { NextResponse } from "next/server";

import {
  loadFpReportHtml,
  loadFpReportMeta,
} from "@/lib/competitiveness-analysis/financial-projection/report/fp-report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function injectReportToolbar(html: string): string {
  const toolbar = `<div class="report-view-toolbar no-print" style="position:sticky;top:0;z-index:9999;display:flex;gap:8px;justify-content:flex-end;padding:8px 12px;background:#1e293b;color:#fff;font-size:13px;">
  <button type="button" onclick="window.print()" style="padding:6px 12px;border-radius:6px;border:none;background:#2563eb;color:#fff;cursor:pointer;">인쇄 / PDF 저장</button>
  <span style="opacity:0.85;font-size:12px;">Ctrl+P → PDF로 저장</span>
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
      return NextResponse.json(
        { error: "유효하지 않은 연도입니다." },
        { status: 400 },
      );
    }

    const meta = await loadFpReportMeta(analysisYear, schoolCode);
    if (!meta) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format === "html") {
      const html = await loadFpReportHtml(analysisYear, schoolCode);
      if (!html) {
        return NextResponse.json(
          { error: "보고서 HTML을 찾을 수 없습니다." },
          { status: 404 },
        );
      }
      return new NextResponse(
        injectReportToolbar(html),
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (format === "pdf") {
      try {
        const { loadCachedFpReportPdf, fpReportPdfFilename } = await import(
          "@/lib/competitiveness-analysis/financial-projection/report/ensure-fp-report-pdf"
        );
        const pdf = await loadCachedFpReportPdf(analysisYear, schoolCode);
        const filename = fpReportPdfFilename({
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
        return NextResponse.json({ error: message }, { status: 404 });
      }
    }

    return NextResponse.json({ meta });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "보고서 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
