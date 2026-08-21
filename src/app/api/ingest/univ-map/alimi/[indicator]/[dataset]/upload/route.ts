import { NextResponse } from "next/server";

import { requireAdminUpload } from "@/lib/auth/require-admin";

import {
  getUnivAlimiDatasets,
  isUnivAlimiIndicator,
  parseUnivAlimiDataset,
} from "@/lib/analysis/univ-alimi-raw/screens";
import { ingestUnivAlimiRawUpload } from "@/lib/ingest/univ-alimi-raw-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ indicator: string; dataset: string }> },
) {
  const denied = await requireAdminUpload();
  if (denied) return denied;
  const { indicator: indicatorRaw, dataset: datasetRaw } = await context.params;
  if (!isUnivAlimiIndicator(indicatorRaw)) {
    return NextResponse.json({ error: "잘못된 지표입니다." }, { status: 400 });
  }
  const dataset = parseUnivAlimiDataset(datasetRaw);
  if (!dataset) {
    return NextResponse.json({ error: "잘못된 dataset입니다." }, { status: 400 });
  }
  if (!getUnivAlimiDatasets(indicatorRaw).includes(dataset)) {
    return NextResponse.json(
      { error: "이 지표는 대학전문만 지원합니다." },
      { status: 400 },
    );
  }

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
    const result = await ingestUnivAlimiRawUpload(
      indicatorRaw,
      dataset,
      buffer,
      file.name,
    );

    return NextResponse.json({
      ok: true,
      rowCount: result.rowCount,
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
