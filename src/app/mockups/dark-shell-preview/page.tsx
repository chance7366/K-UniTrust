import type { Metadata } from "next";

import { DarkShellPreviewMock } from "./DarkShellPreviewMock";

export const metadata: Metadata = {
  title: "D3 다크 셸 통합 목업",
  description:
    "차콜 블루-그레이 main + 다크 사이드바 + 학령인구 본문 시안 (실제 앱 미적용)",
};

export default function DarkShellPreviewPage() {
  return <DarkShellPreviewMock />;
}
