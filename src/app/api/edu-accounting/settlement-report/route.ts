import { NextResponse } from "next/server";

import { requireAdminReportGenerate } from "@/lib/auth/require-admin";
import {
  generateEduSettlementReport,
  saveEduSettlementReport,
} from "@/lib/analysis/edu-accounting/generate-settlement-report";
import { buildEduSettlementGuidelines } from "@/lib/analysis/edu-accounting/settlement-guidelines";
import { REPORT_PDF_PRINT_GUIDANCE } from "@/lib/reports/report-pdf-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function parseYear(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const year = Number(raw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("guidelines") === "1") {
      const year = parseYear(url.searchParams.get("year")) ?? new Date().getFullYear();
      return NextResponse.json({ text: buildEduSettlementGuidelines(year) });
    }

    const year = parseYear(url.searchParams.get("year"));
    const format = url.searchParams.get("format");
    if (format === "pdf") {
      return NextResponse.json({ error: REPORT_PDF_PRINT_GUIDANCE }, { status: 404 });
    }

    const { html, data } = await generateEduSettlementReport(year);
    if (format === "json") {
      return NextResponse.json({
        settlementYear: data.settlementYear,
        priorYear: data.priorYear,
        warnings: data.warnings,
        matchByYear: data.matchByYear,
        schoolCount: data.schools.filter((s) => s.year === data.settlementYear).length,
      });
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "교비회계 결산 종합보고서를 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function formatSaveError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/store has been suspended|store is blocked/i.test(raw)) {
    return "영구 저장(Vercel Blob)이 중단되어 스냅샷을 남기지 못했습니다. 화면·열람의 HTML은 생성됐습니다. Blob 스토어를 재개하거나 토큰을 교체하세요.";
  }
  return `영구 저장에 실패했습니다. 화면·열람의 HTML은 생성됐습니다. (${raw})`;
}

export async function POST(request: Request) {
  const denied = await requireAdminReportGenerate();
  if (denied) return denied;
  try {
    const body = (await request.json().catch(() => ({}))) as { year?: unknown };
    const year = parseYear(body.year != null ? String(body.year) : null);
    const { html, data } = await generateEduSettlementReport(year);

    let saved = true;
    let saveError: string | null = null;
    try {
      await saveEduSettlementReport(data.settlementYear, html);
    } catch (err) {
      saved = false;
      saveError = formatSaveError(err);
      console.warn("[edu-settlement] save failed after generate", err);
    }

    const warnings = [...data.warnings];
    if (saveError) warnings.unshift(saveError);

    return NextResponse.json({
      settlementYear: data.settlementYear,
      generatedAt: data.generatedAt,
      saved,
      saveError,
      warnings,
      match: data.matchByYear[data.settlementYear],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "교비회계 결산 종합보고서를 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
