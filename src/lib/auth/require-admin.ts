import { NextResponse } from "next/server";

import { readAccessRole } from "@/lib/auth/session";

export async function requireAdminUpload(): Promise<NextResponse | null> {
  const role = await readAccessRole();
  if (role === "admin") return null;
  return NextResponse.json(
    { error: "관리자만 데이터를 업로드할 수 있습니다." },
    { status: 403 },
  );
}
