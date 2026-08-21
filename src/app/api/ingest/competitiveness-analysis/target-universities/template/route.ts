import { bufferResponseBody } from "@/lib/http/response-body";

import { buildTargetUniversitiesTemplateBuffer } from "@/lib/ingest/target-universities-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildTargetUniversitiesTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="competitiveness_target_universities_template.xlsx"',
    },
  });
}
