import { bufferResponseBody } from "@/lib/http/response-body";

import { buildAnalysisTargetTemplateBuffer } from "@/lib/ingest/analysis-target-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildAnalysisTargetTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="analysis_target_upload_template.xlsx"',
    },
  });
}
