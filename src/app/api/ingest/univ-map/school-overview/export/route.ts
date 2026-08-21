import { NextResponse } from "next/server";

import { bufferResponseBody } from "@/lib/http/response-body";

import { buildSchoolOverviewDbExport } from "@/lib/ingest/school-overview-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { buffer, filename } = await buildSchoolOverviewDbExport();
    return new Response(bufferResponseBody(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "?? ????? ??????.",
      },
      { status: 404 },
    );
  }
}
