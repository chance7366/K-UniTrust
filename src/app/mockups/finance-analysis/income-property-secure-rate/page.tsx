import { redirect } from "next/navigation";

import { buildIncomePropertyRepHref } from "@/lib/analysis/income-property-secure-rate-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 수익용재산확보율에 반영됨 */
export default async function IncomePropertySecureRateRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildIncomePropertyRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: sp.cohort === "junior-college" ? "junior-college" : "university",
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
