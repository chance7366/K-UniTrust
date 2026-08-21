import type { Metadata } from "next";

import { UploadPanelButtonsMock } from "./UploadPanelButtonsMock";

export const metadata: Metadata = {
  title: "업로드 패널 버튼 목업",
  description:
    "UploadPanel 액션 버튼 심플 3D 리디자인 — 엑셀 파일 선택·숨기기·도움말 (실제 앱 미적용)",
};

export default function UploadPanelButtonsMockPage() {
  return <UploadPanelButtonsMock />;
}
