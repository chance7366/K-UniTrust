"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building,
  Building2,
  Coins,
  Compass,
  Factory,
  Globe,
  GraduationCap,
  HandCoins,
  Hash,
  Landmark,
  Map,
  MapPin,
  Receipt,
  Target,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { Suspense, useEffect, useState, useTransition } from "react";

import { SidebarMenuIcon } from "@/components/layout/SidebarMenuIcon";
import { SidebarBrand } from "@/components/layout/SidebarBrand";
import {
  UNIV_STATUS_MENU_GROUPS,
  getUnivStatusMenuActiveTabId,
  getUnivStatusMenuTabHref,
  isUnivStatusMenuMockPath,
} from "@/lib/analysis/univ-status-menu-mock-tabs";

const SECTION_ICON = GraduationCap;

const GROUP_ICONS: Record<string, LucideIcon> = {
  "school-overview": Building,
  "university-locations": MapPin,
  "university-alimi": GraduationCap,
  "finance-alimi": Landmark,
  "region-population": Map,
  "analysis-target": Target,
};

const TAB_ICONS: Record<string, { icon: LucideIcon; className?: string }> = {
  "school-overview": { icon: Building },
  "university-locations": { icon: MapPin },
  "school-code": { icon: Hash },
  "freshman-enrollment": { icon: UserPlus },
  "enrolled-enrollment": { icon: UserCheck },
  "dropout-rate": { icon: UserMinus, className: "text-rose-500" },
  "enrolled-students": { icon: Users },
  "foreign-students": { icon: Globe },
  "foreign-dropout": { icon: UserMinus, className: "text-rose-500" },
  "avg-tuition": { icon: Receipt, className: "text-amber-600" },
  "origin-school": { icon: Compass },
  "edu-accounting": { icon: Landmark },
  "corp-general": { icon: Building2 },
  "industry-accounting": { icon: Factory },
  "income-property": { icon: Coins },
  "financial-support": { icon: HandCoins },
  "regional-decline": { icon: AlertTriangle, className: "text-rose-500" },
  "school-age-population": { icon: UsersRound },
  "school-age-population-sigungu": { icon: Building2 },
  "analysis-target": { icon: Target },
};

function SectionChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="ml-2 shrink-0 transition-transform duration-200"
      style={{
        color: "var(--text-muted-nav)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function newsMenuClass(active: boolean) {
  return `news-menu-item ${active ? "news-menu-item-active" : ""}`;
}

function UnivStatusMenuNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSection = isUnivStatusMenuMockPath(pathname);
  const activeTabId = getUnivStatusMenuActiveTabId(searchParams.get("tab"));

  const [sectionOpen, setSectionOpen] = useState(true);
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(UNIV_STATUS_MENU_GROUPS.map((g) => [g.id, true])),
  );
  const [, startSync] = useTransition();

  useEffect(() => {
    startSync(() => {
      const activeGroup = UNIV_STATUS_MENU_GROUPS.find((g) =>
        g.tabs.some((t) => t.id === activeTabId),
      );
      if (activeGroup) {
        setGroupOpen((prev) => ({ ...prev, [activeGroup.id]: true }));
      }
    });
  }, [activeTabId]);

  return (
    <nav className="news-sidebar-nav bg-glow-sidebar-nav flex-1 overflow-y-auto px-3 py-4">
      <div className="news-menu-section">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="news-section-title mb-2 flex w-full items-center border-0 bg-transparent px-2 py-0"
          aria-expanded={sectionOpen}
        >
          <span className="mr-2 flex shrink-0 items-center justify-center">
            <SidebarMenuIcon
              icon={SECTION_ICON}
              className="text-emerald-700"
              size={16}
            />
          </span>
          <span className="news-section-label">대학현황</span>
          <span className="news-section-line ml-3 min-w-0 flex-1" />
          <SectionChevron open={sectionOpen} />
        </button>

        {sectionOpen ? (
          <ul className="m-0 list-none p-0">
            {UNIV_STATUS_MENU_GROUPS.map((group) => {
              const isSingleLeaf = group.tabs.length === 1;
              const singleTab = group.tabs[0];
              const groupActive = group.tabs.some((t) => t.id === activeTabId);
              const groupIcon = GROUP_ICONS[group.id] ?? Building;

              if (isSingleLeaf && singleTab) {
                const href = getUnivStatusMenuTabHref(singleTab.id);
                const active = onSection && activeTabId === singleTab.id;
                const tabIcon = TAB_ICONS[singleTab.id] ?? { icon: Hash };
                return (
                  <li key={group.id}>
                    <Link
                      href={href}
                      className={newsMenuClass(active)}
                      aria-current={active ? "page" : undefined}
                    >
                      <SidebarMenuIcon
                        icon={tabIcon.icon}
                        className={tabIcon.className}
                        active={active}
                      />
                      <span className="flex-1">{group.label}</span>
                    </Link>
                  </li>
                );
              }

              const isOpen = groupOpen[group.id] ?? false;
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setGroupOpen((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                    className={newsMenuClass(onSection && groupActive)}
                    aria-expanded={isOpen}
                  >
                    <SidebarMenuIcon
                      icon={groupIcon}
                      active={onSection && groupActive}
                    />
                    <span className="flex-1 text-left">{group.label}</span>
                  </button>
                  {isOpen ? (
                    <ul className="news-sub-list">
                      {group.tabs.map((tab) => {
                        const href = getUnivStatusMenuTabHref(tab.id);
                        const active = onSection && activeTabId === tab.id;
                        const tabIcon = TAB_ICONS[tab.id] ?? { icon: Hash };
                        return (
                          <li key={tab.id}>
                            <Link
                              href={href}
                              className="news-sub-sub-item"
                              data-active={active ? "true" : undefined}
                              aria-current={active ? "page" : undefined}
                            >
                              <SidebarMenuIcon
                                icon={tabIcon.icon}
                                className={tabIcon.className}
                                size={12}
                                active={active}
                              />
                              <span className="min-w-0 flex-1">{tab.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="news-menu-section mt-4 rounded-lg border border-dashed border-amber-300/80 bg-amber-50/50 px-3 py-2.5 dark:border-amber-700/50 dark:bg-amber-950/20">
        <p className="m-0 text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
          <strong>목업</strong> · 대학현황 메뉴 재구성 시안
          <br />
          재정분석지표·대학경쟁력분석 섹션은 프로덕션과 동일
        </p>
      </div>
    </nav>
  );
}

export function UnivStatusMenuMockSidebar() {
  return (
    <aside className="bg-glow-sidebar flex w-64 shrink-0 flex-col border-r border-border">
      <div className="relative bg-glow-sidebar-brand border-b border-border px-5 py-5">
        <Link
          href="/mockups/univ-status-menu"
          className="block rounded-lg outline-offset-2 transition-opacity hover:opacity-90"
          aria-label="대학현황 메뉴 목업"
        >
          <SidebarBrand />
        </Link>
      </div>

      <Suspense
        fallback={
          <nav className="news-sidebar-nav flex-1 px-3 py-4">
            <p className="px-2 text-sm text-muted">메뉴 로딩…</p>
          </nav>
        }
      >
        <UnivStatusMenuNavInner />
      </Suspense>

      <div className="border-t border-border px-4 py-3 text-center text-[10px] text-muted">
        univ-status-menu mock v0.1
      </div>
    </aside>
  );
}
