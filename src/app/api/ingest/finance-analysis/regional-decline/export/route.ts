import { NextResponse } from "next/server";

import { bufferResponseBody } from "@/lib/http/response-body";
import { buildRegionalDeclineDbExport } from "@/lib/ingest/univ-map-population-db-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { buffer, filename } = await buildRegionalDeclineDbExport();
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
          err instanceof Error
            ? err.message
            : "지역인구 DB를 내려받지 못했습니다.",
      },
      { status: 404 },
    );
  }
}
