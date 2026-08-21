import { buildSchoolAgePopulationTemplateBuffer } from "@/lib/ingest/school-age-population-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildSchoolAgePopulationTemplateBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="school_age_population_sido_upload_template.xlsx"',
    },
  });
}
