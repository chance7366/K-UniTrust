import type { Metadata } from "next";

import { SchoolOverviewHeaderMock } from "./SchoolOverviewHeaderMock";

export const metadata: Metadata = {
  title: "학교개황 헤더 목업",
  description:
    "학교개황 페이지 헤더 리디자인 — 부제목 삭제, 진한 녹색 제목, 입체 엑셀업로드 버튼 (실제 앱 미적용)",
};

export default function SchoolOverviewHeaderMockPage() {
  return <SchoolOverviewHeaderMock />;
}
