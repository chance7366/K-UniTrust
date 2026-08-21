"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SidebarMenuIcon } from "@/components/layout/SidebarMenuIcon";
import {
  COMPETITIVENESS_ANALYSIS_MENU_GROUPS,
  getCompetitivenessAnalysisActiveTabId,
  getCompetitivenessAnalysisTabHref,
  isCompetitivenessAnalysisPath,
} from "@/lib/analysis/competitiveness-analysis-tabs";
import {
  FINANCIAL_PROJECTION_MENU_GROUPS,
  getFinancialProjectionActiveTabId,
  getFinancialProjectionTabHref,
  isFinancialProjectionPath,
} from "@/lib/analysis/financial-projection-tabs";
import { isFpAnalysisYear } from "@/lib/competitiveness-analysis/financial-projection/years";
import {
  FINANCE_ANALYSIS_MENU_GROUPS,
  getFinanceAnalysisActiveTabId,
  getFinanceAnalysisTabHref,
  isFinanceAnalysisPath,
} from "@/lib/analysis/finance-analysis-tabs";
import {
  UNIV_MAP_MENU_GROUPS,
  getUnivMapActiveTabId,
  getUnivMapTabHref,
  isUnivMapPath,
} from "@/lib/analysis/univ-map-tabs";
import {
  getSidebarGroupIcon,
  getSidebarTabIcon,
  SIDEBAR_SECTION_ICONS,
} from "@/lib/sidebar-menu-icons";
import {
  mergeGroupOpen,
  readSidebarNavState,
  writeSidebarNavState,
} from "@/lib/sidebar-nav-state";

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

function NewsSectionHeader({
  label,
  open,
  onToggle,
  sectionIcon,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  sectionIcon: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="news-section-title mb-2 flex w-full items-center border-0 bg-transparent px-2 py-0"
      aria-expanded={open}
    >
      <span className="mr-2 flex shrink-0 items-center justify-center">
        <SidebarMenuIcon
          icon={sectionIcon}
          className="text-emerald-700"
          size={16}
        />
      </span>
      <span className="news-section-label">{label}</span>
      <span className="news-section-line ml-3 min-w-0 flex-1" />
      <SectionChevron open={open} />
    </button>
  );
}

function newsMenuClass(active: boolean) {
  return `news-menu-item ${active ? "news-menu-item-active" : ""}`;
}

function initialGroupOpen(
  groups: { id: string }[],
  activeGroupId: string | undefined,
): Record<string, boolean> {
  return Object.fromEntries(groups.map((g) => [g.id, g.id === activeGroupId]));
}

function ensureGroupOpen(
  prev: Record<string, boolean>,
  activeGroupId: string | undefined,
): Record<string, boolean> {
  if (!activeGroupId || prev[activeGroupId]) return prev;
  return { ...prev, [activeGroupId]: true };
}

function MenuGroups({
  groups,
  activeTabId,
  onSection,
  getHref,
  groupOpen,
  setGroupOpen,
}: {
  groups: typeof UNIV_MAP_MENU_GROUPS;
  activeTabId: string;
  onSection: boolean;
  getHref: (tabId: string) => string;
  groupOpen: Record<string, boolean>;
  setGroupOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <ul className="news-mid-list m-0 list-none">
      {groups.map((group) => {
        const isSingleLeaf = group.tabs.length === 1;
        const singleTab = group.tabs[0];
        const groupActive = group.tabs.some((t) => t.id === activeTabId);
        const groupIcon = getSidebarGroupIcon(group.id);

        if (isSingleLeaf && singleTab) {
          const href = getHref(singleTab.id);
          const active = onSection && activeTabId === singleTab.id;
          const tabIcon = getSidebarTabIcon(singleTab.id);
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
                  const href = getHref(tab.id);
                  const active = onSection && activeTabId === tab.id;
                  const tabIcon = getSidebarTabIcon(tab.id);
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
  );
}

export function SidebarNavFallback() {
  return (
    <nav className="news-sidebar-nav bg-glow-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 py-4">
      <p className="px-2 text-sm text-muted">메뉴 로딩…</p>
    </nav>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onFinanceAnalysis = isFinanceAnalysisPath(pathname);
  const onCompetitiveness = isCompetitivenessAnalysisPath(pathname);
  const onFinancialProjection = isFinancialProjectionPath(pathname);
  const onUnivMap = isUnivMapPath(pathname);
  const activeFinanceTab = getFinanceAnalysisActiveTabId(
    pathname,
    searchParams.get("tab"),
  );
  const activeUnivMapTab = getUnivMapActiveTabId(
    pathname,
    searchParams.get("tab"),
  );
  const activeCompetitivenessTab = getCompetitivenessAnalysisActiveTabId(
    pathname,
  );
  const activeFinancialProjectionTab = getFinancialProjectionActiveTabId(
    pathname,
  );

  const [openSections, setOpenSections] = useState({
    univMap: onUnivMap,
    financeAnalysis: onFinanceAnalysis,
    competitiveness: onCompetitiveness,
    financialProjection: onFinancialProjection,
  });
  const [financeGroupOpen, setFinanceGroupOpen] = useState<
    Record<string, boolean>
  >(() =>
    initialGroupOpen(
      FINANCE_ANALYSIS_MENU_GROUPS,
      onFinanceAnalysis
        ? FINANCE_ANALYSIS_MENU_GROUPS.find((g) =>
            g.tabs.some((t) => t.id === activeFinanceTab),
          )?.id
        : undefined,
    ),
  );
  const [univMapGroupOpen, setUnivMapGroupOpen] = useState<
    Record<string, boolean>
  >(() =>
    initialGroupOpen(
      UNIV_MAP_MENU_GROUPS,
      onUnivMap
        ? UNIV_MAP_MENU_GROUPS.find((g) =>
            g.tabs.some((t) => t.id === activeUnivMapTab),
          )?.id
        : undefined,
    ),
  );
  const [competitivenessGroupOpen, setCompetitivenessGroupOpen] = useState<
    Record<string, boolean>
  >(() =>
    initialGroupOpen(
      COMPETITIVENESS_ANALYSIS_MENU_GROUPS,
      onCompetitiveness
        ? COMPETITIVENESS_ANALYSIS_MENU_GROUPS.find((g) =>
            g.tabs.some((t) => t.id === activeCompetitivenessTab),
          )?.id
        : undefined,
    ),
  );
  const [financialProjectionGroupOpen, setFinancialProjectionGroupOpen] =
    useState<Record<string, boolean>>({});
  const skipPersist = useRef(true);

  useEffect(() => {
    const persisted = readSidebarNavState();
    if (persisted) {
      setOpenSections((s) => ({
        univMap: persisted.openSections.univMap || s.univMap,
        financeAnalysis:
          persisted.openSections.financeAnalysis || s.financeAnalysis,
        competitiveness:
          persisted.openSections.competitiveness || s.competitiveness,
        financialProjection:
          persisted.openSections.financialProjection || s.financialProjection,
      }));
      setUnivMapGroupOpen((prev) =>
        mergeGroupOpen(prev, persisted.univMapGroupOpen),
      );
      setFinanceGroupOpen((prev) =>
        mergeGroupOpen(prev, persisted.financeGroupOpen),
      );
      setCompetitivenessGroupOpen((prev) =>
        mergeGroupOpen(prev, persisted.competitivenessGroupOpen),
      );
    }
    skipPersist.current = true;
  }, []);

  useEffect(() => {
    setOpenSections((s) => ({
      univMap: onUnivMap ? true : s.univMap,
      financeAnalysis: onFinanceAnalysis ? true : s.financeAnalysis,
      competitiveness: onCompetitiveness ? true : s.competitiveness,
      financialProjection: onFinancialProjection ? true : s.financialProjection,
    }));

    const univMapGroupId = onUnivMap
      ? UNIV_MAP_MENU_GROUPS.find((g) =>
          g.tabs.some((t) => t.id === activeUnivMapTab),
        )?.id
      : undefined;
    const financeGroupId = onFinanceAnalysis
      ? FINANCE_ANALYSIS_MENU_GROUPS.find((g) =>
          g.tabs.some((t) => t.id === activeFinanceTab),
        )?.id
      : undefined;
    const competitivenessGroupId = onCompetitiveness
      ? COMPETITIVENESS_ANALYSIS_MENU_GROUPS.find((g) =>
          g.tabs.some((t) => t.id === activeCompetitivenessTab),
        )?.id
      : undefined;

    setUnivMapGroupOpen((prev) => ensureGroupOpen(prev, univMapGroupId));
    setFinanceGroupOpen((prev) => ensureGroupOpen(prev, financeGroupId));
    setCompetitivenessGroupOpen((prev) =>
      ensureGroupOpen(prev, competitivenessGroupId),
    );
  }, [
    pathname,
    onFinanceAnalysis,
    activeFinanceTab,
    onUnivMap,
    activeUnivMapTab,
    onCompetitiveness,
    activeCompetitivenessTab,
    onFinancialProjection,
    activeFinancialProjectionTab,
  ]);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    writeSidebarNavState({
      openSections,
      financeGroupOpen,
      univMapGroupOpen,
      competitivenessGroupOpen,
    });
  }, [
    openSections,
    financeGroupOpen,
    univMapGroupOpen,
    competitivenessGroupOpen,
  ]);

  return (
    <nav className="news-sidebar-nav bg-glow-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 py-4">
      <div className="news-menu-section">
        <NewsSectionHeader
          label="대학현황"
          open={openSections.univMap}
          onToggle={() =>
            setOpenSections((s) => ({ ...s, univMap: !s.univMap }))
          }
          sectionIcon={SIDEBAR_SECTION_ICONS.univMap}
        />
        {openSections.univMap ? (
          <MenuGroups
            groups={UNIV_MAP_MENU_GROUPS}
            activeTabId={activeUnivMapTab}
            onSection={onUnivMap}
            getHref={getUnivMapTabHref}
            groupOpen={univMapGroupOpen}
            setGroupOpen={setUnivMapGroupOpen}
          />
        ) : null}
      </div>

      <div className="news-menu-section">
        <NewsSectionHeader
          label="재정분석지표"
          open={openSections.financeAnalysis}
          onToggle={() =>
            setOpenSections((s) => ({
              ...s,
              financeAnalysis: !s.financeAnalysis,
            }))
          }
          sectionIcon={SIDEBAR_SECTION_ICONS.financeAnalysis}
        />
        {openSections.financeAnalysis ? (
          <MenuGroups
            groups={FINANCE_ANALYSIS_MENU_GROUPS}
            activeTabId={activeFinanceTab}
            onSection={onFinanceAnalysis}
            getHref={getFinanceAnalysisTabHref}
            groupOpen={financeGroupOpen}
            setGroupOpen={setFinanceGroupOpen}
          />
        ) : null}
      </div>

      <div className="news-menu-section">
        <NewsSectionHeader
          label="대학경쟁력분석"
          open={openSections.competitiveness}
          onToggle={() =>
            setOpenSections((s) => ({
              ...s,
              competitiveness: !s.competitiveness,
            }))
          }
          sectionIcon={SIDEBAR_SECTION_ICONS.competitiveness}
        />
        {openSections.competitiveness ? (
          <MenuGroups
            groups={COMPETITIVENESS_ANALYSIS_MENU_GROUPS}
            activeTabId={activeCompetitivenessTab}
            onSection={onCompetitiveness}
            getHref={getCompetitivenessAnalysisTabHref}
            groupOpen={competitivenessGroupOpen}
            setGroupOpen={setCompetitivenessGroupOpen}
          />
        ) : null}
      </div>

      <div className="news-menu-section">
        <NewsSectionHeader
          label="재정추계분석"
          open={openSections.financialProjection}
          onToggle={() =>
            setOpenSections((s) => ({
              ...s,
              financialProjection: !s.financialProjection,
            }))
          }
          sectionIcon={SIDEBAR_SECTION_ICONS.financialProjection}
        />
        {openSections.financialProjection ? (
          <MenuGroups
            groups={FINANCIAL_PROJECTION_MENU_GROUPS}
            activeTabId={activeFinancialProjectionTab}
            onSection={onFinancialProjection}
            getHref={(tabId) => {
              const yearRaw = Number(searchParams.get("year"));
              return getFinancialProjectionTabHref(
                tabId,
                isFpAnalysisYear(yearRaw) ? yearRaw : undefined,
              );
            }}
            groupOpen={financialProjectionGroupOpen}
            setGroupOpen={setFinancialProjectionGroupOpen}
          />
        ) : null}
      </div>
    </nav>
  );
}
