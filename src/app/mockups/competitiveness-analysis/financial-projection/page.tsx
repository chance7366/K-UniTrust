import type { Metadata } from "next";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";

import { FinancialProjectionUiMock } from "./FinancialProjectionUiMock";

export const metadata: Metadata = {
  title: "재정추계분석 UI 목업 — v0.3",
  description:
    "대상대학·기초자료·시나리오(전체 공통) → 분석결과 → 대학별 조회. 프로덕션 미적용",
};

function MockFallback() {
  return <p className="p-6 text-sm text-muted">불러오는 중…</p>;
}

export default function FinancialProjectionMockPage() {
  return (
    <AppShell>
      <Suspense fallback={<MockFallback />}>
        <FinancialProjectionUiMock />
      </Suspense>
    </AppShell>
  );
}
