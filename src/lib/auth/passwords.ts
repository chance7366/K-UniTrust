import { timingSafeEqual } from "crypto";

import type { AccessRole } from "@/lib/auth/access";

function matchesSecret(input: string, secret: string | undefined): boolean {
  if (!secret) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function roleFromPassword(password: string): AccessRole | null {
  const admin = process.env.KUNITRUST_ADMIN_PASSWORD;
  const user = process.env.KUNITRUST_USER_PASSWORD;
  if (matchesSecret(password, admin)) return "admin";
  if (matchesSecret(password, user)) return "user";
  return null;
}
