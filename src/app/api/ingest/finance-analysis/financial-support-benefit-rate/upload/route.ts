import { NextResponse } from "next/server";

import { requireAdminUpload } from "@/lib/auth/require-admin";

import { ingestFinancialSupportBenefitRateUpload } from "@/lib/ingest/financial-support-benefit-rate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await requireAdminUpload();
  if (denied) return denied;
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "업로드 파일이 없습니다." },
        { status: 400 },
      );
    }

    const lower = file.name.toLowerCase();
    if (
      !lower.endsWith(".xlsx") &&
      !lower.endsWith(".xls") &&
      !lower.endsWith(".csv")
    ) {
      return NextResponse.json(
        { error: "xlsx, xls, csv 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "파일 크기는 20MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestFinancialSupportBenefitRateUpload(
      buffer,
      file.name,
    );

    return NextResponse.json({
      ok: true,
      rowCount: result.rowCount,
      consolidatedRowCount: result.consolidatedRowCount,
      skippedCount: result.skippedCount,
      years: result.years,
      overwrittenYears: result.overwrittenYears,
      newYears: result.newYears,
      bronzePath: result.bronzePath,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "업로드 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
