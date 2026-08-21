/**
 * Apply FDB_TYPO / CHART_TYPO across analysis screens.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ANALYSIS = path.join(ROOT, "src/components/analysis");

const SKIP = new Set([
  "FreshmanEnrollmentDashboard.tsx",
  "FreshmanEnrollmentDataTable.tsx",
  "CorpTransferRatioAdvancedChartDashboard.tsx",
  "FundSecureRateAdvancedChartDashboard.tsx",
  "TuitionDependencyRateAdvancedChartDashboard.tsx",
  "FinancialSupportBenefitRateAdvancedChartDashboard.tsx",
  "AdvancedChartGlobalFilters.tsx",
  "FundSecureRateAdvancedHelp.tsx",
]);

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;
  const m = content.match(/^("use client";\r?\n\r?\n)?/);
  if (m?.[0]) return content.replace(m[0], `${m[0]}${importLine}\n`);
  return `${importLine}\n${content}`;
}

function applyCommonDashboard(content) {
  content = content.replace(
    /<DashboardPageTitle>([^<]+)<\/DashboardPageTitle>/g,
    "<DashboardPageTitle className={FDB_TYPO.pageTitle}>$1</DashboardPageTitle>",
  );
  content = content.replace(
    /<h3 className="text-lg font-semibold">/g,
    "<h3 className={FDB_TYPO.panelTitle}>",
  );
  content = content.replace(
    /className="mt-0\.5 text-xs text-muted"/g,
    "className={`mt-1 ${FDB_TYPO.panelMeta}`}",
  );
  content = content.replace(
    /className="text-xs text-muted">표시 연도/g,
    "className={FDB_TYPO.toolbarLabel}>표시 연도",
  );
  content = content.replace(
    /className="text-sm text-muted"/g,
    "className={FDB_TYPO.bodyText}",
  );
  content = content.replace(
    /className="text-\[11px\] text-muted"/g,
    "className={FDB_TYPO.legend}",
  );
  content = content.replace(
    /className=\{`rounded-md px-4 py-2 text-sm font-medium transition-colors \$\{/g,
    "className={`rounded-md px-4 py-2 transition-colors ${",
  );
  content = content.replace(
    /active === tab\.id\s*\?\s*"bg-surface text-foreground shadow-sm ring-1 ring-border"/g,
    "active === tab.id ? `${FDB_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`",
  );
  content = content.replace(
    /active === id\s*\?\s*"bg-surface text-foreground shadow-sm ring-1 ring-border"/g,
    "active === id ? `${FDB_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`",
  );
  content = content.replace(
    /: "text-muted hover:text-foreground"/g,
    ": `${FDB_TYPO.sectionTabInactive} hover:text-foreground`",
  );
  content = content.replace(
    /<label className="text-xs text-muted">/g,
    "<label className={FDB_TYPO.toolbarLabel}>",
  );
  content = content.replace(
    /className="rounded-md border border-border bg-surface-2 px-2\.5 py-1 text-xs outline-none focus:border-accent"/g,
    "className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}",
  );
  content = content.replace(
    /className=\{`rounded-md px-3 py-1\.5 text-xs font-medium transition-colors \$\{/g,
    "className={`rounded-md px-3 py-1.5 transition-colors ${",
  );
  content = content.replace(
    /value === "campus"\s*\?\s*"bg-accent\/15 text-accent shadow-sm"/g,
    'value === "campus" ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`',
  );
  content = content.replace(
    /value === "consolidated"\s*\?\s*"bg-accent\/15 text-accent shadow-sm"/g,
    'value === "consolidated" ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`',
  );
  content = content.replace(
    /className=\{`rounded-md border px-2\.5 py-1 text-xs transition-colors \$\{/g,
    "className={`rounded-md border px-2.5 py-1 transition-colors ${FDB_TYPO.toolbarControl} ${",
  );
  content = content.replace(
    /className="rounded-md border border-border bg-surface-2 px-2\.5 py-1 text-xs text-muted hover:text-foreground"/g,
    "className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}",
  );
  content = content.replace(
    /className="text-xs font-medium uppercase tracking-wide text-accent-cyan">엑셀업로드/g,
    'className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>엑셀업로드',
  );
  content = content.replace(
    /className="mt-1 text-base font-semibold">/g,
    'className={`mt-1 ${FDB_TYPO.panelTitle}`}>',
  );
  content = content.replace(
    /className="mt-2 max-w-xl text-sm text-muted"/g,
    'className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}',
  );
  return content;
}

function applyDataTable(content) {
  if (!content.includes("tableHeadClass")) {
    content = content.replace(
      /(\n\nexport function \w+DataTable)/,
      "\n\nconst tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;\n$1",
    );
  }

  content = content.replace(
    /const metricCellClass =\s*"([^"]*)"/,
    (_, cls) => {
      const cleaned = cls.replace(/\btext-xs\b/g, "").replace(/\s+/g, " ").trim();
      return `const metricCellClass = \`${cleaned} \${FDB_TYPO.tableBody}\``;
    },
  );

  content = content.replace(
    /<table className="w-full table-fixed border-collapse text-sm">/g,
    "<table className={`w-full table-fixed border-collapse ${FDB_TYPO.tableBody}`}>",
  );

  content = content.replace(
    /className="text-table-head([^"]*?)text-xs font-medium"/g,
    'className={`${tableHeadClass}$1`}',
  );

  content = content.replace(
    /className=\{`text-table-head([^`]*?)text-xs font-medium/g,
    "className={`${tableHeadClass}$1",
  );

  return content;
}

function applyChartWrapper(content) {
  content = content.replace(
    /className="text-xs text-muted">통계분석 지표/g,
    "className={CHART_TYPO.filterLabel}>통계분석 지표",
  );
  content = content.replace(
    /className=\{`rounded-md border px-3 py-1\.5 text-xs font-medium transition-colors \$\{/g,
    "className={`rounded-md border px-3 py-1.5 transition-colors ${CHART_TYPO.toolbarControl} ${",
  );
  content = content.replace(
    /className="mt-2 text-xs text-muted"/g,
    "className={`mt-2 ${CHART_TYPO.legend}`}",
  );
  return content;
}

function applyCompetitiveness(content, file) {
  if (file.endsWith("CompetitivenessShell.tsx")) {
    content = content.replace(
      /className="text-xs font-medium text-accent-cyan"/g,
      'className={`${FDB_TYPO.legend} font-medium text-accent-cyan`}',
    );
    content = content.replace(
      /className="mt-1 text-2xl font-extrabold tracking-tight/g,
      "className={`mt-1 ${FDB_TYPO.pageTitle} tracking-tight",
    );
    content = content.replace(
      /className="mt-1 text-sm text-muted"/g,
      "className={`mt-1 ${FDB_TYPO.panelMeta}`}",
    );
  }

  content = content.replace(
    /className="text-lg font-semibold"/g,
    "className={FDB_TYPO.panelTitle}",
  );
  content = content.replace(
    /className="text-sm font-semibold"/g,
    "className={FDB_TYPO.sectionTab}",
  );
  content = content.replace(
    /className=\{`rounded-md px-4 py-2 text-sm font-medium transition-colors \$\{/g,
    "className={`rounded-md px-4 py-2 transition-colors ${",
  );
  content = content.replace(
    /className="text-xs text-muted"/g,
    "className={FDB_TYPO.legend}",
  );
  content = content.replace(
    /className="text-sm text-muted"/g,
    "className={FDB_TYPO.bodyText}",
  );
  content = content.replace(
    /className="rounded-md border border-border bg-surface-2 px-3 py-1\.5 text-sm outline-none/g,
    "className={`rounded-md border border-border bg-surface-2 px-3 py-1.5 outline-none ${FDB_TYPO.toolbarControl}",
  );
  return content;
}

const files = walk(ANALYSIS);
let changed = 0;

for (const file of files) {
  const base = path.basename(file);
  if (SKIP.has(base)) continue;

  let content = fs.readFileSync(file, "utf8");
  const original = content;

  const isDashboard = base.endsWith("Dashboard.tsx");
  const isDataTable = base.endsWith("DataTable.tsx");
  const isComp = file.includes("competitiveness-analysis");
  const isChartWrapper =
    base.includes("ChartDashboard") &&
    content.includes("CorpTransferRatioAdvancedChartDashboard");

  const needsFdb =
    (isDashboard || isDataTable || isComp) && !content.includes("FDB_TYPO");
  const needsChart =
    isChartWrapper && !content.includes("CHART_TYPO");

  if (needsFdb) {
    content = ensureImport(
      content,
      'import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";',
    );
  }
  if (needsChart) {
    content = ensureImport(
      content,
      'import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";',
    );
  }

  if (isDashboard || (isComp && !isDataTable)) {
    content = applyCommonDashboard(content);
  }
  if (isDataTable) content = applyDataTable(content);
  if (isChartWrapper) content = applyChartWrapper(content);
  if (isComp) content = applyCompetitiveness(content, file);

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changed++;
    console.log("updated:", path.relative(ROOT, file));
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
