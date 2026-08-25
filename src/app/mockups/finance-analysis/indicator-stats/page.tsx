import { EnrolledScaleLookupProvider } from "@/components/analysis/EnrolledScaleLookupContext";
import { loadEnrolledScaleLookupJson } from "@/lib/analysis/enrolled-students-rep-count";

import { IndicatorStatsMockPage } from "./IndicatorStatsMockPage";
import { loadIndicatorStatsMockPayload, yearsFromPayload } from "./load";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "지표통계 탭 목업",
  description: "재정분석지표 8개 하위 메뉴 통계분석 지표통계 미리보기.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function IndicatorStatsMockRoute({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const payload = await loadIndicatorStatsMockPayload(sp);
  const lookup = await loadEnrolledScaleLookupJson(yearsFromPayload(payload));

  return (
    <EnrolledScaleLookupProvider value={lookup}>
      <IndicatorStatsMockPage payload={payload} />
    </EnrolledScaleLookupProvider>
  );
}
