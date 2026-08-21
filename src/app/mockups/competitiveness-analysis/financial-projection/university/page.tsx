import type { Metadata } from "next";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";

import { FpUniversityLookupMock } from "./FpUniversityLookupMock";

export const metadata: Metadata = {
  title: "대학별추계 UI 목업 — 대학목록 레이아웃",
  description:
    "대학별경쟁력과 같은 전국·지역 필터와 좌측 대학목록. 추계결과·한계진단·대응전략 조회. 프로덕션 미적용",
};

function MockFallback() {
  return <p className="p-6 text-sm text-muted">불러오는 중…</p>;
}

export default function FpUniversityLookupMockPage() {
  return (
    <AppShell>
      <Suspense fallback={<MockFallback />}>
        <FpUniversityLookupMock />
      </Suspense>
    </AppShell>
  );
}
