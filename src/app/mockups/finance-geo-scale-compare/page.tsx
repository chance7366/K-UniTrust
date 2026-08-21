import type { Metadata } from "next";

import { FinanceGeoScaleCompareMock } from "./FinanceGeoScaleCompareMock";

export const metadata: Metadata = {
  title: "지역·권역 격차 — 학생 규모 비교 목업",
  description:
    "5대 권역 비교 옆에 학생 규모 비교를 두고, 시·도 순위를 아래로 내린 배치 목업. 프로덕션 미적용.",
};

export default function FinanceGeoScaleCompareMockPage() {
  return <FinanceGeoScaleCompareMock />;
}
