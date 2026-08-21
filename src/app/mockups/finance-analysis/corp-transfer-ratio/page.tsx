import { redirect } from "next/navigation";

import { buildCorpTransferRepHref } from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 법인전입금비율에 반영됨 */
export default async function CorpTransferRatioRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildCorpTransferRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: sp.cohort === "junior-college" ? "junior-college" : "university",
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
