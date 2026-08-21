import { NextResponse } from "next/server";

import { requireAdminUpload } from "@/lib/auth/require-admin";

import { consolidateEnrolledEnrollmentPeriods } from "@/lib/ingest/enrolled-enrollment-consolidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdminUpload();
  if (denied) return denied;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      periods?: string[];
    };

    const periods = Array.isArray(body.periods)
      ? body.periods.filter((p) => typeof p === "string" && p.includes(":"))
      : undefined;

    const result = await consolidateEnrolledEnrollmentPeriods(periods);

    return NextResponse.json({
      ok: true,
      totalRows: result.totalRows,
      periods: result.periods,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "본교통합 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
