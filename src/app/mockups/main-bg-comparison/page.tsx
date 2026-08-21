import type { Metadata } from "next";

import { MainBgComparisonMock } from "./MainBgComparisonMock";

export const metadata: Metadata = {
  title: "main 배경 3안 비교 목업",
  description:
    "AppShell main(bg-glow-main) 대체 그라데이션 3안 — 학령인구 헤더·업로드 패널 대비 시안 (실제 앱 미적용)",
};

export default function MainBgComparisonMockPage() {
  return <MainBgComparisonMock />;
}
