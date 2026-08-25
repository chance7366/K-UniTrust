import { parseCorpTransferRepMockQuery } from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";
import { parseDropoutRepMockQuery } from "@/lib/analysis/dropout-rate-rep-mock-view";
import { parseEnrolledRepMockQuery } from "@/lib/analysis/enrolled-enrollment-rep-mock-view";
import {
  FINANCE_ANALYSIS_TABS,
  type FinanceAnalysisTab,
} from "@/lib/analysis/finance-analysis-tabs";
import { parseFinSupportRepMockQuery } from "@/lib/analysis/financial-support-benefit-rate-rep-mock-view";
import { parseFreshmanRepMockQuery } from "@/lib/analysis/freshman-enrollment-rep-mock-view";
import { parseFundSecureRepMockQuery } from "@/lib/analysis/fund-secure-rate-rep-mock-view";
import { parseIncomePropertyRepMockQuery } from "@/lib/analysis/income-property-secure-rate-rep-mock-view";
import { parseTuitionDepRepMockQuery } from "@/lib/analysis/tuition-dependency-rate-rep-mock-view";
import { loadCorpTransferRepMockDashboard } from "@/lib/data/corp-transfer-ratio-rep-mock";
import { loadDropoutRepMockDashboard } from "@/lib/data/dropout-rate-rep-mock";
import { loadEnrolledRepMockDashboard } from "@/lib/data/enrolled-enrollment-rep-mock";
import { loadFinSupportRepMockDashboard } from "@/lib/data/financial-support-benefit-rate-rep-mock";
import { loadFreshmanRepMockDashboard } from "@/lib/data/freshman-enrollment-rep-mock";
import { loadFundSecureRepMockDashboard } from "@/lib/data/fund-secure-rate-rep-mock";
import { loadIncomePropertyRepMockDashboard } from "@/lib/data/income-property-secure-rate-rep-mock";
import { loadTuitionDepRepMockDashboard } from "@/lib/data/tuition-dependency-rate-rep-mock";

import type { IndicatorStatsMockPayload } from "./types";

export function parseIndicatorStatsTab(
  value: string | undefined,
): FinanceAnalysisTab["id"] {
  return FINANCE_ANALYSIS_TABS.some((tab) => tab.id === value)
    ? (value as FinanceAnalysisTab["id"])
    : "freshman-enrollment-rate";
}

export async function loadIndicatorStatsMockPayload(sp: Record<
  string,
  string | undefined
>): Promise<IndicatorStatsMockPayload> {
  const tab = parseIndicatorStatsTab(sp.tab);
  const chartsSp = { ...sp, section: "charts" };

  if (tab === "freshman-enrollment-rate") {
    return {
      tab,
      freshman: await loadFreshmanRepMockDashboard(
        parseFreshmanRepMockQuery(chartsSp),
      ),
    };
  }
  if (tab === "enrolled-enrollment-rate") {
    return {
      tab,
      enrolled: await loadEnrolledRepMockDashboard(
        parseEnrolledRepMockQuery(chartsSp),
      ),
    };
  }
  if (tab === "dropout-rate") {
    return {
      tab,
      dropout: await loadDropoutRepMockDashboard(
        parseDropoutRepMockQuery(chartsSp),
      ),
    };
  }
  if (tab === "fund-secure-rate") {
    return {
      tab,
      fund: await loadFundSecureRepMockDashboard(
        parseFundSecureRepMockQuery(chartsSp),
      ),
    };
  }
  if (tab === "financial-support-benefit-rate") {
    return {
      tab,
      finSupport: await loadFinSupportRepMockDashboard(
        parseFinSupportRepMockQuery(chartsSp),
      ),
    };
  }
  if (tab === "tuition-dependency-rate") {
    return {
      tab,
      tuition: await loadTuitionDepRepMockDashboard(
        parseTuitionDepRepMockQuery(chartsSp),
      ),
    };
  }
  if (tab === "corp-transfer-ratio") {
    return {
      tab,
      corp: await loadCorpTransferRepMockDashboard(
        parseCorpTransferRepMockQuery(chartsSp),
      ),
    };
  }
  return {
    tab: "income-property-secure-rate",
    income: await loadIncomePropertyRepMockDashboard(
      parseIncomePropertyRepMockQuery(chartsSp),
    ),
  };
}

export function yearsFromPayload(payload: IndicatorStatsMockPayload): number[] {
  if (payload.tab === "freshman-enrollment-rate") return payload.freshman.years;
  if (payload.tab === "enrolled-enrollment-rate") return payload.enrolled.years;
  if (payload.tab === "dropout-rate") return payload.dropout.years;
  if (payload.tab === "fund-secure-rate") return payload.fund.years;
  if (payload.tab === "financial-support-benefit-rate") {
    return payload.finSupport.years;
  }
  if (payload.tab === "tuition-dependency-rate") return payload.tuition.years;
  if (payload.tab === "corp-transfer-ratio") return payload.corp.years;
  return payload.income.years;
}
