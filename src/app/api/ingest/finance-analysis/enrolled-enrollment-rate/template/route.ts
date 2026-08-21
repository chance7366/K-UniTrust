import { bufferResponseBody } from "@/lib/http/response-body";

import { buildEnrolledEnrollmentTemplateBuffer } from "@/lib/ingest/enrolled-enrollment-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildEnrolledEnrollmentTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="enrolled_enrollment_upload_template.xlsx"',
    },
  });
}
