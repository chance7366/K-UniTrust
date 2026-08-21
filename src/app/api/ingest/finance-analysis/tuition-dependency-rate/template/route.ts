import { bufferResponseBody } from "@/lib/http/response-body";

import { buildTuitionDependencyRateTemplateBuffer } from "@/lib/ingest/tuition-dependency-rate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildTuitionDependencyRateTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="tuition_dependency_rate_upload_template.xlsx"',
    },
  });
}
