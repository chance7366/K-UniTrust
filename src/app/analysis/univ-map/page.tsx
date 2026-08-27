import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AnalysisTargetDashboard } from "@/components/analysis/AnalysisTargetDashboard";
import { CorpGeneralDashboard } from "@/components/analysis/CorpGeneralDashboard";
import { EduAccountingDashboard } from "@/components/analysis/EduAccountingDashboard";
import { IndustryAccountingDashboard } from "@/components/analysis/IndustryAccountingDashboard";
import { FreshmanEnrollmentAlimiDashboard } from "@/components/analysis/FreshmanEnrollmentAlimiDashboard";
import { UnivAlimiRawDashboard } from "@/components/analysis/UnivAlimiRawDashboard";
import { RegionalDeclineDashboard } from "@/components/analysis/RegionalDeclineDashboard";
import { SchoolAgePopulationDashboard } from "@/components/analysis/SchoolAgePopulationDashboard";
import { SchoolAgePopulationSigunguDashboard } from "@/components/analysis/SchoolAgePopulationSigunguDashboard";
import { SchoolCodeDashboard } from "@/components/analysis/SchoolCodeDashboard";
import { SchoolOverviewDashboard } from "@/components/analysis/SchoolOverviewDashboard";
import { UnivMapDbPlaceholder } from "@/components/analysis/UnivMapDbPlaceholder";
import { UniversityLocationsDashboard } from "@/components/analysis/UniversityLocationsDashboard";
import {
  buildFinanceAnalysisRedirectUrl,
  getUnivMapTab,
  normalizeUnivMapTabId,
} from "@/lib/analysis/univ-map-tabs";
import { UNIV_ALIMI_SCREENS } from "@/lib/analysis/univ-alimi-raw/screens";
import {
  buildEduAccountingLegacyRedirect,
  normalizeEduAccountingSheet,
} from "@/lib/analysis/edu-accounting";
import { normalizeCorpGeneralSheet } from "@/lib/analysis/corp-general";
import {
  buildIndustryAccountingLegacyRedirect,
  normalizeIndustryAccountingSheet,
} from "@/lib/analysis/industry-accounting";
import {
  loadFreshmanEnrollmentAlimiDashboard,
  parseFreshmanEnrollmentAlimiQuery,
} from "@/lib/data/freshman-enrollment-alimi";
import {
  loadUnivAlimiRawDashboard,
  parseUnivAlimiRawQuery,
} from "@/lib/data/univ-alimi-raw";
import { loadRegionalDeclineDashboard } from "@/lib/data/regional-decline";
import { loadSchoolAgePopulationDashboard } from "@/lib/data/school-age-population";
import { loadSchoolAgeSigunguDashboard } from "@/lib/data/school-age-population-sigungu";
import {
  loadAnalysisTargetDashboard,
  parseAnalysisTargetQuery,
} from "@/lib/data/analysis-target";
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

export const dynamic = "force-dynamic";

export const metadata = {
  title: "대학현황",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

async function TabContent({
  tabId,
  sp,
}: {
  tabId: string;
  sp: Record<string, string | undefined>;
}) {
  const tab = getUnivMapTab(tabId);

  if (tab.isPlaceholder) {
    return <UnivMapDbPlaceholder tab={tab} />;
  }

  switch (tabId) {
    case "school-overview": {
      const data = await loadSchoolOverviewDashboard(parseSchoolOverviewQuery(sp));
      return <SchoolOverviewDashboard data={data} />;
    }
    case "university-locations": {
      const data = await loadUniversityLocationsDashboard(
        parseUniversityLocationsQuery(sp),
      );
      return <UniversityLocationsDashboard data={data} />;
    }
    case "school-code": {
      const data = await loadSchoolCodeDashboard(parseSchoolCodeQuery(sp));
      return <SchoolCodeDashboard data={data} />;
    }
    case "freshman-enrollment": {
      const data = await loadFreshmanEnrollmentAlimiDashboard(
        parseFreshmanEnrollmentAlimiQuery(sp),
      );
      return <FreshmanEnrollmentAlimiDashboard data={data} />;
    }
    case "enrolled-enrollment": {
      const data = await loadUnivAlimiRawDashboard(
        "enrolled-enrollment",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["enrolled-enrollment"]}
        />
      );
    }
    case "dropout-rate": {
      const data = await loadUnivAlimiRawDashboard(
        "dropout-rate",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["dropout-rate"]}
        />
      );
    }
    case "enrolled-students": {
      const data = await loadUnivAlimiRawDashboard(
        "enrolled-students",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["enrolled-students"]}
        />
      );
    }
    case "foreign-students": {
      const data = await loadUnivAlimiRawDashboard(
        "foreign-students",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["foreign-students"]}
        />
      );
    }
    case "foreign-dropout": {
      const data = await loadUnivAlimiRawDashboard(
        "foreign-dropout",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["foreign-dropout"]}
        />
      );
    }
    case "origin-school": {
      const data = await loadUnivAlimiRawDashboard(
        "origin-school",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["origin-school"]}
        />
      );
    }
    case "avg-tuition": {
      const data = await loadUnivAlimiRawDashboard(
        "avg-tuition",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["avg-tuition"]}
          metricRoundDigits={0}
          metricUnitLabel="(단위 : 원)"
        />
      );
    }
    case "edu-accounting": {
      const sheetId = normalizeEduAccountingSheet(sp.sheet);
      const data = await loadUnivAlimiRawDashboard(
        sheetId,
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <EduAccountingDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS[sheetId]}
          sheetId={sheetId}
        />
      );
    }
    case "corp-general": {
      const sheetId = normalizeCorpGeneralSheet(sp.sheet);
      const data = await loadUnivAlimiRawDashboard(
        sheetId,
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <CorpGeneralDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS[sheetId]}
          sheetId={sheetId}
        />
      );
    }
    case "industry-accounting": {
      const sheetId = normalizeIndustryAccountingSheet(sp.sheet);
      const data = await loadUnivAlimiRawDashboard(
        sheetId,
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <IndustryAccountingDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS[sheetId]}
          sheetId={sheetId}
        />
      );
    }
    case "income-property": {
      const data = await loadUnivAlimiRawDashboard(
        "income-property",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["income-property"]}
          metricRoundDigits={0}
          metricUnitLabel="(단위 : 천원)"
        />
      );
    }
    case "financial-support": {
      const data = await loadUnivAlimiRawDashboard(
        "financial-support",
        parseUnivAlimiRawQuery(sp),
      );
      return (
        <UnivAlimiRawDashboard
          data={data}
          screen={UNIV_ALIMI_SCREENS["financial-support"]}
          metricUnitLabel="(단위 : 원)"
        />
      );
    }
    case "regional-decline": {
      const data = await loadRegionalDeclineDashboard();
      return <RegionalDeclineDashboard data={data} />;
    }
    case "school-age-population": {
      const data = await loadSchoolAgePopulationDashboard();
      return <SchoolAgePopulationDashboard data={data} />;
    }
    case "school-age-population-sigungu": {
      const data = await loadSchoolAgeSigunguDashboard();
      return <SchoolAgePopulationSigunguDashboard data={data} />;
    }
    case "analysis-target": {
      const data = await loadAnalysisTargetDashboard(
        parseAnalysisTargetQuery(sp),
      );
      return <AnalysisTargetDashboard data={data} />;
    }
    default:
      return <UnivMapDbPlaceholder tab={tab} />;
  }
}

export default async function UnivMapPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  if (sp.tab) {
    const accountingRedirect = buildEduAccountingLegacyRedirect(sp.tab, sp);
    if (accountingRedirect) {
      redirect(accountingRedirect);
    }
    const industryRedirect = buildIndustryAccountingLegacyRedirect(sp.tab, sp);
    if (industryRedirect) {
      redirect(industryRedirect);
    }
    const financeRedirect = buildFinanceAnalysisRedirectUrl(sp.tab, sp);
    if (financeRedirect) {
      redirect(financeRedirect);
    }
  }

  const tabId = normalizeUnivMapTabId(sp.tab);

  return (
    <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
      <TabContent tabId={tabId} sp={sp} />
    </Suspense>
  );
}
