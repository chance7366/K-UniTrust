"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { clearUserAnalysisDrafts } from "@/lib/analysis/clear-user-drafts";

export function HomeLogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await clearUserAnalysisDrafts();
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
