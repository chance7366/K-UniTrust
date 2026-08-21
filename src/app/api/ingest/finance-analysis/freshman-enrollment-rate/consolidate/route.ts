import { NextResponse } from "next/server";

import { requireAdminUpload } from "@/lib/auth/require-admin";

import { consolidateFreshmanEnrollmentYears } from "@/lib/ingest/freshman-enrollment-consolidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdminUpload();
  if (denied) return denied;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      years?: number[];
    };

    const years = Array.isArray(body.years)
      ? body.years.filter((y) => Number.isFinite(y))
      : undefined;

    const result = await consolidateFreshmanEnrollmentYears(years);

    return NextResponse.json({
      ok: true,
      totalRows: result.totalRows,
      years: result.years,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "본교통합 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
