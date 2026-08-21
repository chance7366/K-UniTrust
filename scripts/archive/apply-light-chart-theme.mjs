import fs from "fs";

const files = [
  "src/components/analysis/FundSecureRateAdvancedChartDashboard.tsx",
  "src/components/analysis/CorpTransferRatioAdvancedChartDashboard.tsx",
  "src/components/analysis/TuitionDependencyRateAdvancedChartDashboard.tsx",
  "src/components/analysis/FinancialSupportBenefitRateAdvancedChartDashboard.tsx",
  "src/components/analysis/FreshmanEnrollmentChartDashboard.tsx",
  "src/components/analysis/DropoutRateChartDashboard.tsx",
  "src/components/analysis/EnrolledEnrollmentChartDashboard.tsx",
  "src/components/analysis/FundSecureRateDensityDistributionChart.tsx",
  "src/components/analysis/TuitionDependencyRateDensityDistributionChart.tsx",
  "src/components/analysis/FinancialSupportBenefitRateDensityDistributionChart.tsx",
];

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(
    'import { TEAL_GLOW } from "@/lib/theme/teal-glow";',
    'import { TEAL_GLOW, CHART_THEME } from "@/lib/theme/teal-glow";',
  );
  s = s.replace(
    /grid:\s*"rgba\(26,\s*58,\s*56,\s*0\.[0-9]+\)"/g,
    "grid: CHART_THEME.grid",
  );
  s = s.replace(/axisLabel:\s*"#FFFFFF"/g, "axisLabel: CHART_THEME.axisLabel");
  s = s.replace(/axis:\s*"#FFFFFF"/g, "axis: CHART_THEME.axisLabel");
  s = s.replace(/color:\s*"#082020"/g, "color: CHART_THEME.tooltipText");
  s = s.replace(/color:\s*"#0b2222"/gi, "color: CHART_THEME.tooltipText");
  s = s.replace(
    /border:\s*"1px solid #1a3a38"/gi,
    'border: `1px solid ${CHART_THEME.tooltipBorder}`',
  );
  // Prefer CHART_THEME.axisLabel everywhere instead of white in split layout
  // mint accent from CHART often uses TEAL_GLOW.accent which is now green — ok
  fs.writeFileSync(f, s);
  console.log("updated", f);
}
