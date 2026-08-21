"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function HomeLogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button type="button" className="him-logout" onClick={() => void onLogout()}>
      로그아웃
      <LogOut size={15} aria-hidden />
    </button>
  );
}
