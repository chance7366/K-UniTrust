import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/components/analysis");
const uploadDashboards = [
  "SchoolOverviewDashboard.tsx",
  "SchoolCodeDashboard.tsx",
  "FreshmanEnrollmentDashboard.tsx",
  "EnrolledEnrollmentDashboard.tsx",
  "DropoutRateDashboard.tsx",
  "FundSecureRateDashboard.tsx",
  "FinancialSupportBenefitRateDashboard.tsx",
  "TuitionDependencyRateDashboard.tsx",
  "IncomePropertySecureRateDashboard.tsx",
  "CorpTransferRatioDashboard.tsx",
  "RegionalDeclineDashboard.tsx",
  "SchoolAgePopulationDashboard.tsx",
  "OriginRegionDashboard.tsx",
];

const imports = `import { DashboardPageTitle } from "@/components/analysis/DashboardPageTitle";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
`;

const headerButtonRe =
  /<button\s+type="button"\s+onClick=\{\(\) => setUploadOpen\(true\)\}\s+className="shrink-0 rounded-lg border border-dashed border-accent-cyan\/40 bg-surface-2 px-4 py-2 text-sm text-accent-cyan hover:bg-accent\/10"\s*>\s*엑셀업로드\s*<\/button>/g;

for (const file of uploadDashboards) {
  const filePath = path.join(root, file);
  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes("DashboardPageTitle") && content.includes("<DashboardPageTitle>")) {
    content = content.replace(
      /^("use client";\r?\n\r?\n)/,
      `$1${imports}\n`,
    );
  }

  if (!content.includes("ExcelUploadButton") && content.includes("setUploadOpen(true)")) {
    content = content.replace(
      /^("use client";\r?\n\r?\n)/,
      `$1${imports}\n`,
    );
  }

  content = content.replace(
    headerButtonRe,
    `<ExcelUploadButton onClick={() => setUploadOpen(true)} />`,
  );

  fs.writeFileSync(filePath, content);
  console.log("fixed", file);
}
