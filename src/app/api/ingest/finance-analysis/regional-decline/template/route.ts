import { buildRegionalDeclineTemplateBuffer } from "@/lib/ingest/regional-decline-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildRegionalDeclineTemplateBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="regional_decline_upload_template.xlsx"',
    },
  });
}
