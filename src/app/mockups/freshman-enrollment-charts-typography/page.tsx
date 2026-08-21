import type { Metadata } from "next";

import { FreshmanChartsTypographyMock } from "./FreshmanChartsTypographyMock";

export const metadata: Metadata = {
  title: "신입생충원율 통계분석 타이포 목업",
  description:
    "대학별DB FDB_TYPO 스케일을 통계분석 화면에 매핑한 Before/After 목업 (프로덕션 미적용)",
};

export default function FreshmanChartsTypographyMockPage() {
  return <FreshmanChartsTypographyMock />;
}
