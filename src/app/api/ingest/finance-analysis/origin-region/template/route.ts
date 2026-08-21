import { buildOriginRegionTemplateBuffer } from "@/lib/ingest/origin-region-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildOriginRegionTemplateBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="origin_region_upload_template.xlsx"',
    },
  });
}
