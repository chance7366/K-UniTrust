import { NextResponse } from "next/server";

import { bufferResponseBody } from "@/lib/http/response-body";

import {
  buildDropoutRateDbExport,
  type FinanceAnalysisDbExportVariant,
} from "@/lib/ingest/finance-analysis-db-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseVariant(value: string | null): FinanceAnalysisDbExportVariant {
  return value === "consolidated" ? "consolidated" : "campus";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const variant = parseVariant(searchParams.get("variant"));

  try {
    const { buffer, filename } = await buildDropoutRateDbExport(variant);
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
