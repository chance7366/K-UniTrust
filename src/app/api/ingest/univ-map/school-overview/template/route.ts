import { bufferResponseBody } from "@/lib/http/response-body";

import { buildSchoolOverviewTemplateBuffer } from "@/lib/ingest/school-overview-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildSchoolOverviewTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="school_overview_upload_template.xlsx"',
    },
  });
}
