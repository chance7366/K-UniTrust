import type { Metadata } from "next";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { CompetitivenessProviders } from "@/components/analysis/competitiveness-analysis/CompetitivenessProviders";

import { UniversityCompetitivenessUiMock } from "./UniversityCompetitivenessUiMock";

export const metadata: Metadata = {
  title: "대학별경쟁력 UI 목업 — 분석실행 실데이터",
  description:
    "대학위치형 레이아웃 · 지역·학교종류 필터 · 좌측 분석대상학교 목록 · 우측 지표·순위·평균 비교 차트 (프로덕션 미적용)",
};

function MockFallback() {
  return <p className="p-6 text-sm text-muted">불러오는 중…</p>;
}

export default function UniversityCompetitivenessMockPage() {
  return (
    <AppShell>
      <Suspense fallback={<MockFallback />}>
        <CompetitivenessProviders>
          <UniversityCompetitivenessUiMock />
        </CompetitivenessProviders>
      </Suspense>
    </AppShell>
  );
}
