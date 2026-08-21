import { NextResponse } from "next/server";

import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";
import { FRESHMAN_ENROLLMENT_ALIMI_LABEL } from "@/lib/analysis/freshman-enrollment-alimi/column-map";
import { buildFreshmanEnrollmentAlimiExportBuffer } from "@/lib/ingest/freshman-enrollment-alimi-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDataset(value: string): FreshmanEnrollmentDatasetKind | null {
  if (value === "undergrad" || value === "grad") return value;
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ dataset: string }> },
) {
  const { dataset: datasetRaw } = await context.params;
  const dataset = parseDataset(datasetRaw);
  if (!dataset) {
    return NextResponse.json({ error: "잘못된 dataset입니다." }, { status: 400 });
  }

  try {
    const buffer = await buildFreshmanEnrollmentAlimiExportBuffer(dataset);
    const label = FRESHMAN_ENROLLMENT_ALIMI_LABEL[dataset];
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="freshman_enrollment_${dataset}_export.xlsx"; filename*=UTF-8''${encodeURIComponent(`신입생충원_${label}_원본.xlsx`)}`,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "내보내기 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
