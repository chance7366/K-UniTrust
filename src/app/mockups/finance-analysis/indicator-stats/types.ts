import type { CorpTransferRepMockData } from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";
import type { DropoutRepMockData } from "@/lib/analysis/dropout-rate-rep-mock-view";
import type { EnrolledRepMockData } from "@/lib/analysis/enrolled-enrollment-rep-mock-view";
import type { FinanceAnalysisTab } from "@/lib/analysis/finance-analysis-tabs";
import type { FinSupportRepMockData } from "@/lib/analysis/financial-support-benefit-rate-rep-mock-view";
import type { FreshmanRepMockData } from "@/lib/analysis/freshman-enrollment-rep-mock-view";
import type { FundSecureRepMockData } from "@/lib/analysis/fund-secure-rate-rep-mock-view";
import type { IncomePropertyRepMockData } from "@/lib/analysis/income-property-secure-rate-rep-mock-view";
import type { TuitionDepRepMockData } from "@/lib/analysis/tuition-dependency-rate-rep-mock-view";

export type IndicatorStatsMockPayload =
  | { tab: "freshman-enrollment-rate"; freshman: FreshmanRepMockData }
  | { tab: "enrolled-enrollment-rate"; enrolled: EnrolledRepMockData }
  | { tab: "dropout-rate"; dropout: DropoutRepMockData }
  | { tab: "fund-secure-rate"; fund: FundSecureRepMockData }
  | { tab: "financial-support-benefit-rate"; finSupport: FinSupportRepMockData }
  | { tab: "tuition-dependency-rate"; tuition: TuitionDepRepMockData }
  | { tab: "corp-transfer-ratio"; corp: CorpTransferRepMockData }
  | {
      tab: "income-property-secure-rate";
      income: IncomePropertyRepMockData;
    };

export type IndicatorStatsTabId = FinanceAnalysisTab["id"];
