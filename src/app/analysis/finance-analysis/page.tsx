import { Suspense, type ReactNode } from "react";

import { EnrolledScaleLookupProvider } from "@/components/analysis/EnrolledScaleLookupContext";
import { DropoutRateRepMockPage } from "@/components/mockups/DropoutRateRepMockPage";
import { EnrolledEnrollmentRepMockPage } from "@/components/mockups/EnrolledEnrollmentRepMockPage";
import { FreshmanEnrollmentRepMockPage } from "@/components/mockups/FreshmanEnrollmentRepMockPage";
import { FundSecureRateRepMockPage } from "@/components/mockups/FundSecureRateRepMockPage";
import { TuitionDependencyRateRepMockPage } from "@/components/mockups/TuitionDependencyRateRepMockPage";
import { CorpTransferRatioRepMockPage } from "@/components/mockups/CorpTransferRatioRepMockPage";
import { FinancialSupportBenefitRateRepMockPage } from "@/components/mockups/FinancialSupportBenefitRateRepMockPage";
import { IncomePropertySecureRateRepMockPage } from "@/components/mockups/IncomePropertySecureRateRepMockPage";
import { FINANCE_ANALYSIS_TABS } from "@/lib/analysis/finance-analysis-tabs";
import { buildUnivMapRedirectUrl } from "@/lib/analysis/univ-map-tabs";
import { parseDropoutRepMockQuery } from "@/lib/analysis/dropout-rate-rep-mock-view";
import { loadDropoutRepMockDashboard } from "@/lib/data/dropout-rate-rep-mock";
import { parseEnrolledRepMockQuery } from "@/lib/analysis/enrolled-enrollment-rep-mock-view";
import { loadEnrolledRepMockDashboard } from "@/lib/data/enrolled-enrollment-rep-mock";
import { parseFreshmanRepMockQuery } from "@/lib/analysis/freshman-enrollment-rep-mock-view";
import { loadFreshmanRepMockDashboard } from "@/lib/data/freshman-enrollment-rep-mock";
import { parseFundSecureRepMockQuery } from "@/lib/analysis/fund-secure-rate-rep-mock-view";
import { loadFundSecureRepMockDashboard } from "@/lib/data/fund-secure-rate-rep-mock";
import { parseTuitionDepRepMockQuery } from "@/lib/analysis/tuition-dependency-rate-rep-mock-view";
import { loadTuitionDepRepMockDashboard } from "@/lib/data/tuition-dependency-rate-rep-mock";
import { parseCorpTransferRepMockQuery } from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";
import { loadCorpTransferRepMockDashboard } from "@/lib/data/corp-transfer-ratio-rep-mock";
import { parseFinSupportRepMockQuery } from "@/lib/analysis/financial-support-benefit-rate-rep-mock-view";
import { loadFinSupportRepMockDashboard } from "@/lib/data/financial-support-benefit-rate-rep-mock";
import { parseIncomePropertyRepMockQuery } from "@/lib/analysis/income-property-secure-rate-rep-mock-view";
import { loadIncomePropertyRepMockDashboard } from "@/lib/data/income-property-secure-rate-rep-mock";
import { loadEnrolledScaleLookupJson } from "@/lib/analysis/enrolled-students-rep-count";
import { notFound, redirect } from "next/navigation";

async function withScaleLookup(years: number[], children: ReactNode) {
  const lookup = await loadEnrolledScaleLookupJson(years);
  return (
    <EnrolledScaleLookupProvider value={lookup}>
      {children}
    </EnrolledScaleLookupProvider>
  );
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "재정분석지표",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function FinanceAnalysisPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  if (sp.tab) {
    const redirectUrl = buildUnivMapRedirectUrl(sp.tab, sp);
    if (redirectUrl) {
      redirect(redirectUrl);
    }
  }

  const tabId =
    FINANCE_ANALYSIS_TABS.some((t) => t.id === sp.tab) && sp.tab
      ? sp.tab
      : FINANCE_ANALYSIS_TABS[0].id;

  if (tabId === "freshman-enrollment-rate") {
    const data = await loadFreshmanRepMockDashboard(
      parseFreshmanRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <FreshmanEnrollmentRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  if (tabId === "enrolled-enrollment-rate") {
    const data = await loadEnrolledRepMockDashboard(
      parseEnrolledRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <EnrolledEnrollmentRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  if (tabId === "dropout-rate") {
    const data = await loadDropoutRepMockDashboard(parseDropoutRepMockQuery(sp));
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <DropoutRateRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  if (tabId === "fund-secure-rate") {
    const data = await loadFundSecureRepMockDashboard(
      parseFundSecureRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <FundSecureRateRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  if (tabId === "tuition-dependency-rate") {
    const data = await loadTuitionDepRepMockDashboard(
      parseTuitionDepRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <TuitionDependencyRateRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  if (tabId === "financial-support-benefit-rate") {
    const data = await loadFinSupportRepMockDashboard(
      parseFinSupportRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <FinancialSupportBenefitRateRepMockPage
            data={data}
            variant="production"
          />,
        )}
      </Suspense>
    );
  }

  if (tabId === "corp-transfer-ratio") {
    const data = await loadCorpTransferRepMockDashboard(
      parseCorpTransferRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <CorpTransferRatioRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  if (tabId === "income-property-secure-rate") {
    const data = await loadIncomePropertyRepMockDashboard(
      parseIncomePropertyRepMockQuery(sp),
    );
    return (
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        {await withScaleLookup(
          data.years,
          <IncomePropertySecureRateRepMockPage data={data} variant="production" />,
        )}
      </Suspense>
    );
  }

  notFound();
}
