import { NextResponse } from "next/server";

import {
  INTRO_LOGO_PER_ROW,
  listUniversityLogoIndices,
  sampleEvenly,
  splitIndicesIntoThreeRows,
  UNIVERSITY_LOGO_DIR,
} from "@/lib/university-logos-dir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const indices = await listUniversityLogoIndices();
    const rows = splitIndicesIntoThreeRows(indices).map((row) =>
      sampleEvenly(row, INTRO_LOGO_PER_ROW),
    );
    return NextResponse.json({
      total: indices.length,
      displayedPerRow: INTRO_LOGO_PER_ROW,
      rows,
      sourceDir: UNIVERSITY_LOGO_DIR,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "로고 목록을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
