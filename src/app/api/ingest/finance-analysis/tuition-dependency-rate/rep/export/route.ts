import { NextResponse } from "next/server";

import { bufferResponseBody } from "@/lib/http/response-body";
import { buildTuitionDepRepDbExport } from "@/lib/data/tuition-dependency-rate-rep-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { buffer, filename } = await buildTuitionDepRepDbExport();
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
          err instanceof Error ? err.message : "엑셀 다운로드에 실패했습니다.",
      },
      { status: 404 },
    );
  }
}
