"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  GraduationCap,
  LineChart,
  PieChart,
  Play,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";

import { SidebarBrand } from "@/components/layout/SidebarBrand";
import { SidebarMenuIcon } from "@/components/layout/SidebarMenuIcon";
import {
  STUDENT_FILL_ANALYSIS_MENU_GROUPS,
  getStudentFillAnalysisMockActiveTabId,
  getStudentFillAnalysisMockHref,
} from "@/lib/analysis/student-fill-analysis-tabs";

function newsMenuClass(active: boolean) {
  return `news-menu-item ${active ? "news-menu-item-active" : ""}`;
}

const TAB_ICONS = {
  settings: SlidersHorizontal,
  run: Play,
  university: Award,
} as const;

export function StudentFillMockSidebar() {
  const pathname = usePathname();
  const activeTab = getStudentFillAnalysisMockActiveTabId(pathname);

  return (
    <aside className="bg-glow-sidebar flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border">
      <div className="relative border-b border-border bg-glow-sidebar-brand px-5 py-5">
        <Link
          href="/"
          className="block rounded-lg outline-offset-2 transition-opacity hover:opacity-90"
          aria-label="시작 페이지"
        >
          <SidebarBrand />
        </Link>
      </div>
      <nav className="news-sidebar-nav bg-glow-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 text-[11px] font-semibold tracking-wide text-muted">
          목업 사이드바 · 프로덕션 미적용
        </p>

        <div className="news-menu-section mb-3 opacity-50">
          <div className="news-section-title mb-1 flex items-center px-2">
            <SidebarMenuIcon icon={GraduationCap} className="text-emerald-700" size={16} />
            <span className="news-section-label ml-2">대학현황</span>
          </div>
        </div>
        <div className="news-menu-section mb-3 opacity-50">
          <div className="news-section-title mb-1 flex items-center px-2">
            <SidebarMenuIcon icon={PieChart} className="text-emerald-700" size={16} />
            <span className="news-section-label ml-2">재정분석지표</span>
          </div>
        </div>
        <div className="news-menu-section mb-3 opacity-50">
          <div className="news-section-title mb-1 flex items-center px-2">
            <SidebarMenuIcon icon={Trophy} className="text-emerald-700" size={16} />
            <span className="news-section-label ml-2">대학경쟁력분석</span>
          </div>
        </div>
        <div className="news-menu-section mb-3 opacity-50">
          <div className="news-section-title mb-1 flex items-center px-2">
            <SidebarMenuIcon icon={LineChart} className="text-emerald-700" size={16} />
            <span className="news-section-label ml-2">재정추계분석</span>
          </div>
        </div>

        <div className="news-menu-section">
          <div className="news-section-title mb-2 flex items-center px-2">
            <SidebarMenuIcon icon={Users} className="text-emerald-700" size={16} />
            <span className="news-section-label ml-2">학생충원분석</span>
            <span className="news-section-line ml-3 min-w-0 flex-1" />
          </div>
          <ul className="news-mid-list m-0 list-none">
            {STUDENT_FILL_ANALYSIS_MENU_GROUPS.map((group) => {
              const tab = group.tabs[0]!;
              const href = getStudentFillAnalysisMockHref(tab.id);
              const active = activeTab === tab.id;
              const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS] ?? Users;
              return (
                <li key={group.id}>
                  <Link
                    href={href}
                    className={newsMenuClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <SidebarMenuIcon icon={Icon} active={active} />
                    <span className="flex-1">{group.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
