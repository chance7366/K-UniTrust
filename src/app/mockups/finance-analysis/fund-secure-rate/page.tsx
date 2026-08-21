import { redirect } from "next/navigation";

import { buildFundSecureRepHref } from "@/lib/analysis/fund-secure-rate-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 자금확보율에 반영됨 */
export default async function FundSecureRateRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildFundSecureRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: sp.cohort === "junior-college" ? "junior-college" : "university",
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
