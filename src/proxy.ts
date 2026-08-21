import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  isExcelUploadApiPath,
  parseAccessToken,
} from "@/lib/auth/access";

const PUBLIC_PATHS = new Set(["/", "/api/auth/login", "/api/auth/logout"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const role = await parseAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  if (role) {
    const mutating =
      request.method === "POST" ||
      request.method === "PUT" ||
      request.method === "PATCH";
    if (mutating && isExcelUploadApiPath(pathname) && role !== "admin") {
      return NextResponse.json(
        { error: "관리자만 데이터를 업로드할 수 있습니다." },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
