import type { Metadata } from "next";

import { AiStatusPlacementMock } from "./AiStatusPlacementMock";

export const metadata: Metadata = {
  title: "AI 상태 배치 목업",
  description:
    "AI Connected/Idle 표시를 상단 헤더에서 사이드바 브랜드 우하단으로 이동 — 실제 앱 미적용",
};

export default function AiStatusPlacementMockPage() {
  return <AiStatusPlacementMock />;
}
