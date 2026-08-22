"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { AiStatusBadge } from "@/components/layout/AiStatusBadge";
import { clearUserAnalysisDrafts } from "@/lib/analysis/clear-user-drafts";
import { SidebarBrand } from "@/components/layout/SidebarBrand";
import { SidebarNav, SidebarNavFallback } from "@/components/layout/SidebarNav";
import type { AccessRole } from "@/lib/auth/access";
import { accessRoleLabel } from "@/lib/auth/access";
import type { AiStatus } from "@/lib/ai-status";
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/sidebar-nav-state";

function FoldHandle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="sidebar-fold shrink-0"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-controls="app-sidebar"
      aria-label={collapsed ? "사이드바 펼치기" : "사이드바 숨기기"}
      title={collapsed ? "메뉴 펼치기" : "메뉴 숨기기"}
    >
      <svg
        width="8"
        height="14"
        viewBox="0 0 8 14"
        fill="none"
        aria-hidden
      >
        <path
          d={collapsed ? "M2 2.5 6 7 2 11.5" : "M6 2.5 2 7 6 11.5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function Sidebar({
  aiStatus = "idle",
  accessRole = null,
}: {
  aiStatus?: AiStatus;
  accessRole?: AccessRole | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      writeSidebarCollapsed(next);
      return next;
    });
  };

  return (
    <div
      id="app-sidebar"
      className="relative z-20 flex h-full shrink-0"
    >
      {!collapsed ? (
        <aside className="bg-glow-sidebar flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border">
          <div className="relative bg-glow-sidebar-brand border-b border-border px-5 py-5">
            <Link
              href="/"
              className="block rounded-lg outline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3b9a6a]"
              aria-label="K-UniTrust Dashboard 시작 페이지로 이동"
            >
              <SidebarBrand />
            </Link>
            <div className="pointer-events-none absolute bottom-3 right-4">
              <AiStatusBadge status={aiStatus} />
            </div>
          </div>

          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>

          <div className="border-t border-border px-4 py-3 text-center text-[10px] text-muted">
            {accessRole ? (
              <p className="mb-1.5 text-[11px] font-semibold text-foreground">
                {accessRoleLabel(accessRole)}
              </p>
            ) : null}
            <button
              type="button"
              className="mb-1.5 text-[11px] font-semibold text-muted hover:text-foreground"
              onClick={() => {
                void clearUserAnalysisDrafts().then(() =>
                  fetch("/api/auth/logout", { method: "POST" }).then(() => {
                    window.location.href = "/";
                  }),
                );
              }}
            >
              로그아웃
            </button>
            <p>CSV store · data/csv</p>
          </div>
        </aside>
      ) : null}
      <FoldHandle collapsed={collapsed} onToggle={toggleCollapsed} />
    </div>
  );
}
