import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  loadVisitorStats,
  recordVisitor,
  toVisitorStatsView,
} from "@/lib/analytics/visitor-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_ID_COOKIE = "kunitrust_vid";
const VISITOR_DATE_COOKIE = "kunitrust_vdate";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;
const VISITOR_DATE_MAX_AGE = 60 * 60 * 24 * 2;

function applyVisitorCookies(
  response: NextResponse,
  result: Awaited<ReturnType<typeof recordVisitor>>,
): NextResponse {
  if (result.setVisitorId) {
    response.cookies.set(VISITOR_ID_COOKIE, result.visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }
  if (result.setVisitDate) {
    response.cookies.set(VISITOR_DATE_COOKIE, result.stats.dateKey, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_DATE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export async function GET() {
  try {
    const stats = await loadVisitorStats();
    return NextResponse.json(toVisitorStatsView(stats));
  } catch {
    return NextResponse.json(
      { error: "방문자 통계를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const jar = await cookies();
    const result = await recordVisitor({
      visitorId: jar.get(VISITOR_ID_COOKIE)?.value ?? null,
      lastVisitDate: jar.get(VISITOR_DATE_COOKIE)?.value ?? null,
    });

    const response = NextResponse.json(result.stats);
    return applyVisitorCookies(response, result);
  } catch (error) {
    console.error("[visitor-stats] record failed", error);
    return NextResponse.json(
      { error: "방문자 통계를 기록하지 못했습니다." },
      { status: 500 },
    );
  }
}
