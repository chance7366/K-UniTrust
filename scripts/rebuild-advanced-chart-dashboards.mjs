import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/components/analysis");
const tuitionPath = path.join(root, "TuitionDependencyRateAdvancedChartDashboard.tsx");
let tuition = fs.readFileSync(tuitionPath, "utf8");

tuition = tuition.replace(/useState\("�縳"\)/g, 'useState("사립")');

const variants = [
  {
    out: "FundSecureRateAdvancedChartDashboard.tsx",
    replacements: [
      ["TuitionDependencyRateAdvancedChartDashboard", "FundSecureRateAdvancedChartDashboard"],
      ["TuitionDependencyRateAdvancedChartDashboardProps", "FundSecureRateAdvancedChartDashboardProps"],
      ["tuition-dependency-rate-advanced-analytics", "fund-secure-rate-advanced-analytics"],
      ["tuition-dependency-rate-advanced-help", "fund-secure-rate-advanced-help"],
      ["TuitionDependencyRateAdvancedRow", "FundSecureRateAdvancedRow"],
      ["TuitionDependencyAdvancedFilters", "FundSecureAdvancedFilters"],
      ["TUITION_DEPENDENCY_ADVANCED", "FUND_SECURE_ADVANCED"],
      ["TuitionDependencyRateDensityDistributionChart", "FundSecureRateDensityDistributionChart"],
      ["등록금의존율", "자금확보율"],
      ["등록금 수입", "총자금"],
    ],
  },
  {
    out: "FinancialSupportBenefitRateAdvancedChartDashboard.tsx",
    replacements: [
      ["TuitionDependencyRateAdvancedChartDashboard", "FinancialSupportBenefitRateAdvancedChartDashboard"],
      [
        "TuitionDependencyRateAdvancedChartDashboardProps",
        "FinancialSupportBenefitRateAdvancedChartDashboardProps",
      ],
      [
        "tuition-dependency-rate-advanced-analytics",
        "financial-support-benefit-rate-advanced-analytics",
      ],
      [
        "tuition-dependency-rate-advanced-help",
        "financial-support-benefit-rate-advanced-help",
      ],
      ["TuitionDependencyRateAdvancedRow", "FinancialSupportBenefitRateAdvancedRow"],
      ["TuitionDependencyAdvancedFilters", "FinancialSupportBenefitAdvancedFilters"],
      ["TUITION_DEPENDENCY_ADVANCED", "FINANCIAL_SUPPORT_BENEFIT_ADVANCED"],
      [
        "TuitionDependencyRateDensityDistributionChart",
        "FinancialSupportBenefitRateDensityDistributionChart",
      ],
      ["등록금의존율", "재정지원수혜율"],
    ],
  },
];

for (const variant of variants) {
  let content = tuition;
  for (const [from, to] of variant.replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(path.join(root, variant.out), content, "utf8");
  console.log("wrote", variant.out);
}
