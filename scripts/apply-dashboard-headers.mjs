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

const headerButtonOld = `            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="shrink-0 rounded-lg border border-dashed border-accent-cyan/40 bg-surface-2 px-4 py-2 text-sm text-accent-cyan hover:bg-accent/10"
            >
              엑셀 데이터 업로드
            </button>`;

const headerButtonNew = `            <ExcelUploadButton onClick={() => setUploadOpen(true)} />`;

const titleBlockRe =
  /<div>\s*<h1 className="text-xl font-bold tracking-wide">([\s\S]*?)<\/h1>\s*<p className="mt-1 text-sm text-muted">[\s\S]*?<\/p>\s*<\/div>/g;

for (const file of uploadDashboards) {
  const filePath = path.join(root, file);
  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes("DashboardPageTitle")) {
    content = content.replace('"use client";\n\n', `"use client";\n\n${imports}\n`);
  }

  content = content.replaceAll(headerButtonOld, headerButtonNew);
  content = content.replaceAll(
    "flex flex-wrap items-start justify-between gap-3",
    "flex flex-wrap items-center justify-between gap-3",
  );
  content = content.replace(titleBlockRe, (_, title) => {
    const trimmed = title.replace(/\s+/g, " ").trim();
    return `<DashboardPageTitle>${trimmed}</DashboardPageTitle>`;
  });
  content = content.replaceAll("엑셀 데이터 업로드", "엑셀업로드");

  fs.writeFileSync(filePath, content);
  console.log("updated", file);
}

const univLocPath = path.join(root, "UniversityLocationsDashboard.tsx");
let univLoc = fs.readFileSync(univLocPath, "utf8");
if (!univLoc.includes("DashboardPageTitle")) {
  univLoc = univLoc.replace(
    '"use client";\n\n',
    `"use client";\n\nimport { DashboardPageTitle } from "@/components/analysis/DashboardPageTitle";\n\n`,
  );
}
univLoc = univLoc.replace(
  /<h1 className="text-xl font-bold tracking-wide">대학위치<\/h1>\s*<p className="mt-1 text-sm text-muted">[\s\S]*?<\/p>\s*/,
  `<DashboardPageTitle>대학위치</DashboardPageTitle>\n          `,
);
fs.writeFileSync(univLocPath, univLoc);
console.log("updated UniversityLocationsDashboard.tsx");

const compShellPath = path.join(
  root,
  "competitiveness-analysis/CompetitivenessShell.tsx",
);
let compShell = fs.readFileSync(compShellPath, "utf8");
compShell = compShell.replace(
  '<h1 className="mt-1 text-2xl font-bold tracking-tight">',
  '<h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1a5c3a] [text-shadow:0_1px_0_rgba(255,255,255,0.65)]">',
);
fs.writeFileSync(compShellPath, compShell);
console.log("updated CompetitivenessShell.tsx");
