import { NextResponse } from "next/server";

import { bufferResponseBody } from "@/lib/http/response-body";

import { buildTargetUniversitiesDbExport } from "@/lib/ingest/target-universities-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { buffer, filename } = await buildTargetUniversitiesDbExport();
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
          err instanceof Error ? err.message : "다운로드할 데이터가 없습니다.",
      },
      { status: 404 },
    );
  }
}
