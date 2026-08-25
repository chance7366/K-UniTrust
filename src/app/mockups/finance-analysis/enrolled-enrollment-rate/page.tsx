import { redirect } from "next/navigation";

import { parseStudentFillViewCohort } from "@/lib/analysis/all-universities-cohort";
import { buildEnrolledRepHref } from "@/lib/analysis/enrolled-enrollment-rep-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 재정분석 재학생충원율에 반영됨 */
export default async function EnrolledEnrollmentRepMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildEnrolledRepHref({
      year: sp.year ? Number(sp.year) : null,
      cohort: parseStudentFillViewCohort(sp.cohort),
      section: sp.section === "charts" ? "charts" : "data",
      estb: sp.estb,
      region: sp.region,
      q: sp.q,
    }),
  );
}
