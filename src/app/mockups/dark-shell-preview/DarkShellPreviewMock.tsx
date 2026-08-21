"use client";

import Link from "next/link";
import { BarChart3, MapPin } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { SidebarBrandLogoMark } from "@/components/layout/SidebarBrand";
import { SidebarMenuIcon } from "@/components/layout/SidebarMenuIcon";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  COMPETITIVENESS_ANALYSIS_MENU_GROUPS,
} from "@/lib/analysis/competitiveness-analysis-tabs";
import {
  FINANCIAL_PROJECTION_MENU_GROUPS,
} from "@/lib/analysis/financial-projection-tabs";
import {
  FINANCE_ANALYSIS_MENU_GROUPS,
} from "@/lib/analysis/finance-analysis-tabs";
import { UNIV_MAP_MENU_GROUPS } from "@/lib/analysis/univ-map-tabs";
import {
  getSidebarGroupIcon,
  getSidebarTabIcon,
  SIDEBAR_SECTION_ICONS,
} from "@/lib/sidebar-menu-icons";

import "./dark-shell-preview.css";

const ACTIVE_TAB = "school-age-population";

type MenuGroupLike = {
  id: string;
  label: string;
  tabs: { id: string; label: string }[];
};

type MenuSectionProps = {
  label: string;
  sectionIcon: typeof SIDEBAR_SECTION_ICONS.univMap;
  groups: MenuGroupLike[];
  defaultOpen?: boolean;
};

function DarkSidebarMenuSection({
  label,
  sectionIcon,
  groups,
  defaultOpen = true,
}: MenuSectionProps) {
  const SectionIcon = sectionIcon;

  return (
    <div className="dsp-section">
      <div className="dsp-section-title">
        <SidebarMenuIcon icon={SectionIcon} className="mr-1 text-emerald-400" size={16} />
        {label}
        <span className="dsp-section-line" />
      </div>
      {defaultOpen ? (
        <ul className="m-0 list-none p-0">
          {groups.map((group) => {
            const isSingle = group.tabs.length === 1;
            const groupIcon = getSidebarGroupIcon(group.id);
            const groupActive = group.tabs.some((t) => t.id === ACTIVE_TAB);

            if (isSingle && group.tabs[0]) {
              const tab = group.tabs[0];
              const active = tab.id === ACTIVE_TAB;
              const tabIcon = getSidebarTabIcon(tab.id);
              return (
                <li key={group.id}>
                  <span
                    className={`dsp-menu-item${active ? " dsp-menu-item--group-open" : ""}`}
                  >
                    <SidebarMenuIcon
                      icon={tabIcon.icon}
                      className={tabIcon.className}
                      active={active}
                    />
                    <span>{group.label}</span>
                  </span>
                </li>
              );
            }

            return (
              <li key={group.id}>
                <span
                  className={`dsp-menu-item${groupActive ? " dsp-menu-item--group-open" : ""}`}
                >
                  <SidebarMenuIcon icon={groupIcon} active={groupActive} />
                  <span className="flex-1">{group.label}</span>
                </span>
                {groupActive || group.id === "region-population" ? (
                  <ul className="dsp-sub-list">
                    {group.tabs.map((tab) => {
                      const active = tab.id === ACTIVE_TAB;
                      const tabIcon = getSidebarTabIcon(tab.id);
                      return (
                        <li key={tab.id}>
                          <span
                            className={`dsp-sub-item${active ? " dsp-sub-item--active" : ""}`}
                          >
                            <SidebarMenuIcon
                              icon={tabIcon.icon}
                              className={tabIcon.className}
                              size={12}
                              active={active}
                            />
                            <span>{tab.label}</span>
                          </span>
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
  );
}

function DarkSidebarMock() {
  return (
    <aside className="dsp-sidebar">
      <div className="dsp-sidebar-brand">
        <div className="flex items-center gap-3">
          <SidebarBrandLogoMark size={42} />
          <div className="min-w-0">
            <div className="dsp-brand-title">K-UniTrust</div>
            <span className="dsp-brand-badge">Dashboard</span>
          </div>
        </div>
      </div>

      <nav className="dsp-sidebar-nav">
        <DarkSidebarMenuSection
          label="대학현황"
          sectionIcon={SIDEBAR_SECTION_ICONS.univMap}
          groups={UNIV_MAP_MENU_GROUPS}
        />
        <DarkSidebarMenuSection
          label="재정분석지표"
          sectionIcon={SIDEBAR_SECTION_ICONS.financeAnalysis}
          groups={FINANCE_ANALYSIS_MENU_GROUPS}
        />
        <DarkSidebarMenuSection
          label="대학경쟁력분석"
          sectionIcon={SIDEBAR_SECTION_ICONS.competitiveness}
          groups={COMPETITIVENESS_ANALYSIS_MENU_GROUPS}
        />
        <DarkSidebarMenuSection
          label="재정추계분석"
          sectionIcon={SIDEBAR_SECTION_ICONS.financialProjection}
          groups={FINANCIAL_PROJECTION_MENU_GROUPS}
        />
      </nav>

      <div className="dsp-sidebar-footer">CSV store · data/csv</div>
    </aside>
  );
}

function MainContentMock() {
  return (
    <div className="dsp-content">
      <DashboardEmeraldHeader
        sectionLabel="재정분석"
        title="학령인구"
        subtitle="교육통계연보 · 초·중·고 학년별 학생수"
        action={<ExcelUploadButton variant="emerald" />}
      />

      <section className="dsp-upload-panel">
        <p
          className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}
        >
          엑셀업로드
        </p>
        <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>학령인구</h4>
        <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
          고등·중등·초등 학년별 학생수 엑셀을 업로드하면{" "}
          <code className="text-accent">data/csv/finance_analysis_school_age_population.csv</code>
          에 저장됩니다.
        </p>
        <p className={`mt-2 ${FDB_TYPO.legend}`}>
  최근 업로드: 2026. 8. 10. · 90행 · 18건 저장
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
          role="tablist"
        >
          <button
            type="button"
            className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60 bg-surface`}
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            시도별자료
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm font-medium text-muted"
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            학령인구대시보드
          </button>
        </div>
      </div>

      <section className="dsp-card dsp-card-pad">
        <div className="flex flex-wrap items-center gap-2">
          <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
          {[2025, 2024, 2023, 2022, 2021].map((y, i) => (
            <button
              key={y}
              type="button"
              className={`h-[30px] rounded-md border px-2.5 py-1 ${FDB_TYPO.toolbarControl} ${
                i === 0
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              {y}년
            </button>
          ))}
        </div>
      </section>

      <section className="dsp-card overflow-hidden">
        <table className="dsp-table min-w-[720px]">
          <thead>
            <tr>
              <th rowSpan={2}>구분</th>
              <th colSpan={3}>고등학교</th>
              <th colSpan={3}>중학교</th>
            </tr>
            <tr>
              <th>3학년</th>
              <th>2학년</th>
              <th>1학년</th>
              <th>3학년</th>
              <th>2학년</th>
              <th>1학년</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>전국</td>
              <td className="num">439,660</td>
              <td className="num">426,516</td>
              <td className="num">421,385</td>
              <td className="num">443,764</td>
              <td className="num">447,974</td>
              <td className="num">462,429</td>
            </tr>
            <tr>
              <td>서울</td>
              <td className="num">69,635</td>
              <td className="num">67,097</td>
              <td className="num">64,913</td>
              <td className="num">65,420</td>
              <td className="num">64,864</td>
              <td className="num">67,369</td>
            </tr>
            <tr>
              <td>경기</td>
              <td className="num">121,195</td>
              <td className="num">118,875</td>
              <td className="num">117,482</td>
              <td className="num">126,418</td>
              <td className="num">127,792</td>
              <td className="num">132,913</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="dsp-note">
        D3 · 차콜 블루-그레이 — main{" "}
        <code>#232a35 → #1c2330 → #171e28</code> + sidebar{" "}
        <code>#1e2632 → #121820</code>. 카드·헤더는 프로덕션 밝은 surface 유지.
      </p>
    </div>
  );
}

export function DarkShellPreviewMock() {
  return (
    <>
      <div className="dsp-banner">
        <span>
          ✦ D3 차콜 블루-그레이 · 사이드바+본문 통합 목업 · 실제 AppShell/Sidebar 미적용
        </span>
        <Link href="/analysis/finance-analysis?tab=school-age-population">
          현재 앱(밝은 테마) 보기 →
        </Link>
      </div>

      <div className="dsp-shell">
        <DarkSidebarMock />
        <main className="dsp-main">
          <MainContentMock />
        </main>
      </div>
    </>
  );
}
