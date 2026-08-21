import type { Metadata } from "next";

import { SidebarIconsShowcase } from "./SidebarIconsShowcase";

export const metadata: Metadata = {
  title: "사이드바 아이콘 쇼케이스 (목업)",
  description:
    "K-UniTrust 사이드바 Lucide 아이콘 리뉴얼 미리보기 — Gemini HTML 참조, 실제 앱 미적용",
};

export default function SidebarIconsMockPage() {
  return <SidebarIconsShowcase />;
}
