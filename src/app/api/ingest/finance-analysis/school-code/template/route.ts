import { bufferResponseBody } from "@/lib/http/response-body";

import { buildSchoolCodeTemplateBuffer } from "@/lib/ingest/school-code-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildSchoolCodeTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="school_code_upload_template.xlsx"',
    },
  });
}
