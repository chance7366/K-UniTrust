import { Suspense } from "react";

import { DropoutRateDashboard } from "@/components/analysis/DropoutRateDashboard";
import { EnrolledEnrollmentDashboard } from "@/components/analysis/EnrolledEnrollmentDashboard";
import { FreshmanEnrollmentDashboard } from "@/components/analysis/FreshmanEnrollmentDashboard";
import { OriginRegionDashboard } from "@/components/analysis/OriginRegionDashboard";
import { RegionalDeclineDashboard } from "@/components/analysis/RegionalDeclineDashboard";
import { SchoolAgePopulationDashboard } from "@/components/analysis/SchoolAgePopulationDashboard";
import { SchoolAgePopulationSigunguDashboard } from "@/components/analysis/SchoolAgePopulationSigunguDashboard";
import { SchoolCodeDashboard } from "@/components/analysis/SchoolCodeDashboard";
import { SchoolOverviewDashboard } from "@/components/analysis/SchoolOverviewDashboard";
import { UniversityLocationsDashboard } from "@/components/analysis/UniversityLocationsDashboard";
import {
  UNIV_STATUS_MENU_TABS,
  getUnivStatusMenuTab,
} from "@/lib/analysis/univ-status-menu-mock-tabs";
import {
  loadDropoutRateDashboard,
  parseDropoutRateQuery,
} from "@/lib/data/dropout-rate";
import {
  loadEnrolledEnrollmentDashboard,
  parseEnrolledEnrollmentQuery,
} from "@/lib/data/enrolled-enrollment";
import {
  loadFreshmanEnrollmentDashboard,
  parseFreshmanEnrollmentQuery,
} from "@/lib/data/freshman-enrollment";
import { loadOriginRegionDashboard, parseOriginRegionQuery } from "@/lib/data/origin-region";
import { loadRegionalDeclineDashboard } from "@/lib/data/regional-decline";
import { loadSchoolAgePopulationDashboard } from "@/lib/data/school-age-population";
import { loadSchoolAgeSigunguDashboard } from "@/lib/data/school-age-population-sigungu";
import {
  loadSchoolCodeDashboard,
  parseSchoolCodeQuery,
} from "@/lib/data/school-code";
import {
  loadSchoolOverviewDashboard,
  parseSchoolOverviewQuery,
} from "@/lib/data/school-overview";
import {
  loadUniversityLocationsDashboard,
  parseUniversityLocationsQuery,
} from "@/lib/data/university-locations";

import { UnivStatusDbPlaceholder } from "./UnivStatusDbPlaceholder";
import { UnivStatusMenuShell } from "./UnivStatusMenuShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "대학현황 메뉴 재구성 — 목업",
  description:
    "대학알리미·재정알리미·지역인구·분석대상 신설 및 학교코드 이동 시안 (프로덕션 미적용)",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function prodReference(tab: ReturnType<typeof getUnivStatusMenuTab>): string | undefined {
  if (tab.contentKind === "univ-map" && tab.sourceTabId) {
    return `/analysis/univ-map?tab=${tab.sourceTabId}`;
  }
  if (tab.contentKind === "finance-analysis" && tab.sourceTabId) {
    return `/analysis/finance-analysis?tab=${tab.sourceTabId}`;
  }
  return undefined;
}

async function TabContent({
  tabId,
  sp,
}: {
  tabId: string;
  sp: Record<string, string | undefined>;
}) {
  const tab = getUnivStatusMenuTab(tabId);

  if (tab.contentKind === "placeholder") {
    return <UnivStatusDbPlaceholder tab={tab} />;
  }

  const sourceId = tab.sourceTabId ?? tab.id;

  if (sourceId === "school-overview") {
    const data = await loadSchoolOverviewDashboard(parseSchoolOverviewQuery(sp));
    return <SchoolOverviewDashboard data={data} />;
  }

  if (sourceId === "university-locations") {
    const data = await loadUniversityLocationsDashboard(
      parseUniversityLocationsQuery(sp),
    );
    return <UniversityLocationsDashboard data={data} />;
  }

  if (sourceId === "school-code") {
    const data = await loadSchoolCodeDashboard(parseSchoolCodeQuery(sp));
    return <SchoolCodeDashboard data={data} />;
  }

  if (sourceId === "freshman-enrollment-rate") {
    const data = await loadFreshmanEnrollmentDashboard(
      parseFreshmanEnrollmentQuery(sp),
    );
    return <FreshmanEnrollmentDashboard data={data} />;
  }

  if (sourceId === "enrolled-enrollment-rate") {
    const data = await loadEnrolledEnrollmentDashboard(
      parseEnrolledEnrollmentQuery(sp),
    );
    return <EnrolledEnrollmentDashboard data={data} />;
  }

  if (sourceId === "dropout-rate") {
    const data = await loadDropoutRateDashboard(parseDropoutRateQuery(sp));
    return <DropoutRateDashboard data={data} />;
  }

  if (sourceId === "origin-region") {
    const data = await loadOriginRegionDashboard(parseOriginRegionQuery(sp));
    return <OriginRegionDashboard data={data} />;
  }

  if (sourceId === "regional-decline") {
    const data = await loadRegionalDeclineDashboard();
    return <RegionalDeclineDashboard data={data} />;
  }

  if (sourceId === "school-age-population") {
    const data = await loadSchoolAgePopulationDashboard();
    return <SchoolAgePopulationDashboard data={data} />;
  }

  if (sourceId === "school-age-population-sigungu") {
    const data = await loadSchoolAgeSigunguDashboard();
    return <SchoolAgePopulationSigunguDashboard data={data} />;
  }

  return <UnivStatusDbPlaceholder tab={tab} />;
}

export default async function UnivStatusMenuMockPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tabId =
    sp.tab && UNIV_STATUS_MENU_TABS.some((t) => t.id === sp.tab)
      ? sp.tab
      : UNIV_STATUS_MENU_TABS[0].id;
  const tab = getUnivStatusMenuTab(tabId);

  return (
    <UnivStatusMenuShell
      activeTabLabel={tab.label}
      activeGroupLabel={tab.groupLabel}
      isNewScreen={tab.isNewScreen}
      prodReference={prodReference(tab)}
    >
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        <TabContent tabId={tabId} sp={sp} />
      </Suspense>
    </UnivStatusMenuShell>
  );
}
