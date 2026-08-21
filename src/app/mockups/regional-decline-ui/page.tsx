import type { Metadata } from "next";

import { RegionalDeclineUiMock } from "./RegionalDeclineUiMock";

export const metadata: Metadata = {
  title: "지역소멸 — UI 패턴 목업",
  description:
    "학교개황 패턴(에메랄드 헤더·슬림 탭·표 밀도)을 지역소멸에 적용한 시안 (실제 앱 미적용)",
};

export default function RegionalDeclineUiMockPage() {
  return <RegionalDeclineUiMock />;
}
