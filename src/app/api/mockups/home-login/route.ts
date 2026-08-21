import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type HomeLoginMockRole = "admin" | "user";

function matchesSecret(input: string, secret: string | undefined): boolean {
  if (!secret) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** 시작페이지 비밀번호 목업 전용. 프로덕션 `/` 에는 연결하지 않습니다. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    const admin = process.env.KUNITRUST_ADMIN_PASSWORD;
    const user = process.env.KUNITRUST_USER_PASSWORD;
    if (!admin || !user) {
      return NextResponse.json(
        { error: ".env 에 관리자·사용자 비밀번호가 없습니다." },
        { status: 500 },
      );
    }
    if (matchesSecret(password, admin)) {
      return NextResponse.json({
        ok: true,
        role: "admin" satisfies HomeLoginMockRole,
        roleLabel: "관리자",
      });
    }
    if (matchesSecret(password, user)) {
      return NextResponse.json({
        ok: true,
        role: "user" satisfies HomeLoginMockRole,
        roleLabel: "사용자",
      });
    }
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  } catch {
    return NextResponse.json({ error: "비밀번호를 확인하지 못했습니다." }, { status: 400 });
  }
}
