import { buildSchoolAgeSigunguTemplateBuffer } from "@/lib/ingest/school-age-population-sigungu-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildSchoolAgeSigunguTemplateBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="school_age_population_sigungu_upload_template.xlsx"',
    },
  });
}
