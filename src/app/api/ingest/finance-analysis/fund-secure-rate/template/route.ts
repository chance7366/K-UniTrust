import { bufferResponseBody } from "@/lib/http/response-body";

import { buildFundSecureRateTemplateBuffer } from "@/lib/ingest/fund-secure-rate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildFundSecureRateTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="fund_secure_rate_upload_template.xlsx"',
    },
  });
}
