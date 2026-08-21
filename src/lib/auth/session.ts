import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  parseAccessToken,
  type AccessRole,
} from "@/lib/auth/access";

export async function readAccessRole(): Promise<AccessRole | null> {
  const jar = await cookies();
  return parseAccessToken(jar.get(ACCESS_COOKIE)?.value);
}
