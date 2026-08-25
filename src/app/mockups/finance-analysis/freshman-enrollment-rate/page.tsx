import { redirect } from "next/navigation";

import { buildFreshmanRepHref } from "@/lib/analysis/freshman-enrollment-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 신입생충원율에 반영됨 */
export default async function FreshmanEnrollmentRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildFreshmanRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort:
        sp.cohort === "junior-college" ||
        sp.cohort === "graduate" ||
        sp.cohort === "combined" ||
        sp.cohort === "all-universities"
          ? sp.cohort
          : "university",
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
