import type { Metadata } from "next";

import { FontPretendardMock } from "./FontPretendardMock";

export const metadata: Metadata = {
  title: "Pretendard 폰트 목업",
  description:
    "한글 UI Pretendard 적용 Before/After 비교 — Sora 브랜드·JetBrains Mono 숫자 유지, 실제 앱 미적용",
};

export default function FontPretendardMockPage() {
  return <FontPretendardMock />;
}
