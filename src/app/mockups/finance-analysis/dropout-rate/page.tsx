import { redirect } from "next/navigation";

import { parseStudentFillViewCohort } from "@/lib/analysis/all-universities-cohort";
import { buildDropoutRepHref } from "@/lib/analysis/dropout-rate-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 중도탈락율에 반영됨 */
export default async function DropoutRateRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildDropoutRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: parseStudentFillViewCohort(sp.cohort),
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
