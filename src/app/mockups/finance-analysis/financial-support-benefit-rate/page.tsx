import { redirect } from "next/navigation";

import { buildFinSupportRepHref } from "@/lib/analysis/financial-support-benefit-rate-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 재정지원수혜율에 반영됨 */
export default async function FinancialSupportBenefitRateRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildFinSupportRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: sp.cohort === "junior-college" ? "junior-college" : "university",
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
