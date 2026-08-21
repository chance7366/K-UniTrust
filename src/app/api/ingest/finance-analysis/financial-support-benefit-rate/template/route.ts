import { bufferResponseBody } from "@/lib/http/response-body";

import { buildFinancialSupportBenefitRateTemplateBuffer } from "@/lib/ingest/financial-support-benefit-rate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildFinancialSupportBenefitRateTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="financial_support_benefit_rate_upload_template.xlsx"',
    },
  });
}
