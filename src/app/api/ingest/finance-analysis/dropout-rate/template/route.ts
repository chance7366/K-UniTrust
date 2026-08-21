import { bufferResponseBody } from "@/lib/http/response-body";

import { buildDropoutRateTemplateBuffer } from "@/lib/ingest/dropout-rate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildDropoutRateTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="dropout_rate_upload_template.xlsx"',
    },
  });
}
