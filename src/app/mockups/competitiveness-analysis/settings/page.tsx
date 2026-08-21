import { redirect } from "next/navigation";

import {
  buildCompetitivenessTargetUnivHref,
  parseCompetitivenessTargetUnivQuery,
} from "@/lib/analysis/competitiveness-target-univ-mock-view";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 목업은 프로덕션 대학경쟁력분석 기본설정 대상대학에 반영됨 */
export default async function CompetitivenessSettingsTargetMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  redirect(
    buildCompetitivenessTargetUnivHref(parseCompetitivenessTargetUnivQuery(sp)),
  );
}
