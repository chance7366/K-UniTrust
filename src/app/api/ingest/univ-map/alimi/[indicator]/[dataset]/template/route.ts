import { NextResponse } from "next/server";

import {
  getUnivAlimiDatasets,
  isUnivAlimiIndicator,
  parseUnivAlimiDataset,
  UNIV_ALIMI_DATASET_LABEL,
  UNIV_ALIMI_SCREENS,
} from "@/lib/analysis/univ-alimi-raw/screens";
import { buildUnivAlimiRawTemplateBuffer } from "@/lib/ingest/univ-alimi-raw-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ indicator: string; dataset: string }> },
) {
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
    const buffer = await buildUnivAlimiRawTemplateBuffer(indicatorRaw, dataset);
    const title = UNIV_ALIMI_SCREENS[indicatorRaw].title;
    const label = UNIV_ALIMI_DATASET_LABEL[dataset];
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${indicatorRaw}_${dataset}_template.xlsx"; filename*=UTF-8''${encodeURIComponent(`${title}_${label}_양식.xlsx`)}`,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "양식 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
