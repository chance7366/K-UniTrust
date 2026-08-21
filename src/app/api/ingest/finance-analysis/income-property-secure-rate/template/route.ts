import { NextResponse } from "next/server";

import { buildIncomePropertySecureRateTemplateBuffer } from "@/lib/ingest/income-property-secure-rate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildIncomePropertySecureRateTemplateBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="income_property_secure_rate_upload_template.xlsx"',
    },
  });
}
