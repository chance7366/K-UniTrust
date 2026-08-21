import type { Metadata } from "next";

import { TabSelectedColorMock } from "./TabSelectedColorMock";

export const metadata: Metadata = {
  title: "탭 선택색 목업",
  description: "대학별지표·코호트 선택 색 비교 — 실제 앱 미적용",
};

export default function TabSelectedColorMockPage() {
  return <TabSelectedColorMock />;
}
