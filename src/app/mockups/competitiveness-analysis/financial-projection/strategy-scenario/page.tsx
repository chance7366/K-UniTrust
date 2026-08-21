import type { Metadata } from "next";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";

import { StrategyScenarioMock } from "./StrategyScenarioMock";

export const metadata: Metadata = {
  title: "대응전략 시나리오 비교 — UI 목업 · K-UniTrust",
  description:
    "대학별추계 대응전략에서 기본설정 시나리오(낙관·기본·비관·한계) 가정값을 이 대학만 가감하고 손익적자·기금고갈 연도 변화를 보는 목업. 프로덕션 미적용.",
};

function MockFallback() {
  return <p className="p-6 text-sm text-muted">불러오는 중…</p>;
}

export default function StrategyScenarioMockPage() {
  return (
    <AppShell>
      <Suspense fallback={<MockFallback />}>
        <StrategyScenarioMock />
      </Suspense>
    </AppShell>
  );
}
