import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { HomeLandingMock } from "./HomeLandingMock";

export const metadata: Metadata = {
  title: "메인(랜딩) 페이지 — UI 목업 · K-UniTrust",
  description:
    "K-UniTrust Dashboard 첫 화면 시안. AppShell(사이드바) 유지 + 히어로·KPI·기능 카드·워크플로 (프로덕션 미적용)",
};

export default function HomeLandingMockPage() {
  return (
    <AppShell>
      <HomeLandingMock />
    </AppShell>
  );
}
