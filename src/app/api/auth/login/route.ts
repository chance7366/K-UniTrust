import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE_SEC,
  accessRoleLabel,
  createAccessToken,
} from "@/lib/auth/access";
import { roleFromPassword } from "@/lib/auth/passwords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (!process.env.KUNITRUST_ADMIN_PASSWORD || !process.env.KUNITRUST_USER_PASSWORD) {
      return NextResponse.json(
        { error: ".env 에 관리자·사용자 비밀번호가 없습니다." },
        { status: 500 },
      );
    }
    const role = roleFromPassword(password);
    if (!role) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }
    const token = await createAccessToken(role);
    const res = NextResponse.json({
      ok: true,
      role,
      roleLabel: accessRoleLabel(role),
    });
    res.cookies.set(ACCESS_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_MAX_AGE_SEC,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "비밀번호를 확인하지 못했습니다." },
      { status: 400 },
    );
  }
}
