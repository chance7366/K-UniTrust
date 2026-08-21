import { buildFreshmanEnrollmentTemplateBuffer } from "@/lib/ingest/freshman-enrollment-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildFreshmanEnrollmentTemplateBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="freshman_enrollment_upload_template.xlsx"',
    },
  });
}
