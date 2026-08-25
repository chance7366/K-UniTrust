import { EnrolledScaleLookupProvider } from "@/components/analysis/EnrolledScaleLookupContext";
import { loadEnrolledScaleLookupJson } from "@/lib/analysis/enrolled-students-rep-count";

import { AllUniversitiesTabMock } from "./AllUniversitiesTabMock";
import { loadAllUnivMockPayload } from "./load-payload";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "전체대학 탭 목업",
  description:
    "신입생충원율·재정지표에 전체대학 탭을 더한 목업. 프로덕션 미적용.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AllUniversitiesTabMockPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const data = await loadAllUnivMockPayload(sp);
  const lookup = await loadEnrolledScaleLookupJson(data.years);

  return (
    <EnrolledScaleLookupProvider value={lookup}>
      <AllUniversitiesTabMock data={data} />
    </EnrolledScaleLookupProvider>
  );
}
