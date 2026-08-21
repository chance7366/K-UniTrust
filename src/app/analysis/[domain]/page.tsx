import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ tab?: string; year?: string; view?: string }>;
};

/** 삭제된 공공데이터포털 경로 → 유지 메뉴로 이관 */
const LEGACY_DOMAIN_BASE: Record<string, string> = {
  student: "/analysis/finance-analysis",
  finance: "/analysis/finance-analysis",
  "univ-basic": "/analysis/univ-map",
  "school-info": "/analysis/univ-map",
  "univ-dept": "/analysis/univ-map",
  universities: "/analysis/univ-map",
};

const LEGACY_DOMAIN_DEFAULT_TAB: Record<string, string> = {
  student: "freshman-enrollment-rate",
  finance: "fund-secure-rate",
  "univ-basic": "school-overview",
  "school-info": "school-overview",
  "univ-dept": "school-code",
  universities: "school-overview",
};

/** 포털 student 탭 id → 대학재정분석 탭 id */
const LEGACY_STUDENT_TAB: Record<string, string> = {
  "freshman-fill": "freshman-enrollment-rate",
  "enrolled-fill": "enrolled-enrollment-rate",
  dropout: "dropout-rate",
  opportunity: "origin-school",
  competition: "freshman-enrollment-rate",
  employment: "freshman-enrollment-rate",
};

/** 포털 finance 탭 id → 대학재정분석 탭 id */
const LEGACY_FINANCE_TAB: Record<string, string> = {
  tuition: "tuition-dependency-rate",
  scholarship: "financial-support-benefit-rate",
  fund: "fund-secure-rate",
};

function resolveLegacyTab(domain: string, tab: string | undefined): string {
  const fallback = LEGACY_DOMAIN_DEFAULT_TAB[domain] ?? "school-overview";
  if (!tab) return fallback;
  if (domain === "student") {
    return LEGACY_STUDENT_TAB[tab] ?? fallback;
  }
  if (domain === "finance") {
    return LEGACY_FINANCE_TAB[tab] ?? fallback;
  }
  return tab in LEGACY_DOMAIN_DEFAULT_TAB ? LEGACY_DOMAIN_DEFAULT_TAB[domain]! : fallback;
}

export default async function LegacyAnalysisRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const { domain } = await params;
  const sp = await searchParams;

  const base = LEGACY_DOMAIN_BASE[domain];
  if (!base) {
    redirect("/analysis/univ-map?tab=school-overview");
  }

  const qs = new URLSearchParams();
  qs.set("tab", resolveLegacyTab(domain, sp.tab));
  if (sp.year) qs.set("year", sp.year);
  if (sp.view) qs.set("view", sp.view);

  redirect(`${base}?${qs.toString()}`);
}
