import type { Metadata } from "next";

import { CompetitivenessRunUiMock } from "./CompetitivenessRunUiMock";

export const metadata: Metadata = {
  title: "대학경쟁력분석 분석실행 — UI 패턴 목업",
  description:
    "학교개황 패턴(에메랄드 헤더·슬림 탭·표 밀도)을 분석실행에 적용한 시안 (실제 앱 미적용)",
};

export default function CompetitivenessRunUiMockPage() {
  return <CompetitivenessRunUiMock />;
}
