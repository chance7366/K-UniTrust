import type { Metadata } from "next";

import { SchoolCodeDashboardMock } from "./SchoolCodeDashboardMock";

export const metadata: Metadata = {
  title: "학교코드 — UI 패턴 목업",
  description:
    "학교개황 패턴(에메랄드 헤더·슬림 KPI·필터 툴바)을 학교코드 메뉴에 적용한 시안 (실제 앱 미적용)",
};

export default function SchoolCodeMockPage() {
  return <SchoolCodeDashboardMock />;
}
