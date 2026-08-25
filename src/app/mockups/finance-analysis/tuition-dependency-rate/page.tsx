import { redirect } from "next/navigation";

import { parseTwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";
import { buildTuitionDepRepHref } from "@/lib/analysis/tuition-dependency-rate-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 등록금의존율에 반영됨 */
export default async function TuitionDependencyRateRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildTuitionDepRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: parseTwoSchoolViewCohort(sp.cohort),
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
